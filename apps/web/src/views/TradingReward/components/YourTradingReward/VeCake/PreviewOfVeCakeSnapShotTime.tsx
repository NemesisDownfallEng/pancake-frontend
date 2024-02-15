import { useTranslation } from '@pancakeswap/localization'
import { Box, CheckmarkCircleFillIcon, ErrorIcon, Flex, Image, Text } from '@pancakeswap/uikit'
import { getBalanceAmount, getDecimalAmount } from '@pancakeswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { ASSET_CDN } from 'config/constants/endpoints'
import { WEEK } from 'config/constants/veCake'
import { useVeCakeBalance } from 'hooks/useTokenBalance'
import { useMemo } from 'react'
import { useLockCakeData } from 'state/vecake/hooks'
import { styled } from 'styled-components'
import { getVeCakeAmount } from 'utils/getVeCakeAmount'
import { useCurrentBlockTimestamp } from 'views/CakeStaking/hooks/useCurrentBlockTimestamp'
import { useProxyVeCakeBalance } from 'views/CakeStaking/hooks/useProxyVeCakeBalance'
import { useTargetUnlockTime } from 'views/CakeStaking/hooks/useTargetUnlockTime'
import { useCakeLockStatus } from 'views/CakeStaking/hooks/useVeCakeUserInfo'
import { CakeLockStatus } from 'views/CakeStaking/types'
import { VeCakeModalView } from 'views/TradingReward/components/YourTradingReward/VeCake/VeCakeAddCakeOrWeeksModal'
import { timeFormat } from 'views/TradingReward/utils/timeFormat'

const SnapShotTimeContainer = styled(Flex)<{ $isValid: boolean }>`
  width: 100%;
  flex-direction: column;
  padding: 16px;
  border-radius: 24px;
  border: ${({ $isValid, theme }) => ($isValid ? '2px dashed #e7e3eb' : `1px solid ${theme.colors.warning}`)};
  background-color: ${({ theme, $isValid }) => ($isValid ? theme.colors.tertiary : 'rgba(255, 178, 55, 0.10)')};
`

interface PreviewOfVeCakeSnapShotTimeProps {
  viewMode?: VeCakeModalView
  endTime: number
  thresholdLockAmount: number
}

export const PreviewOfVeCakeSnapShotTime: React.FC<React.PropsWithChildren<PreviewOfVeCakeSnapShotTimeProps>> = ({
  viewMode,
  endTime,
  thresholdLockAmount,
}) => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()
  const currentTimestamp = useCurrentBlockTimestamp()

  const { balance: veCakeBalance } = useVeCakeBalance()
  const { cakeLockAmount, cakeLockWeeks } = useLockCakeData()
  const { cakeUnlockTime, cakeLockExpired, nativeCakeLockedAmount, status } = useCakeLockStatus()
  const { balance: proxyVeCakeBalance } = useProxyVeCakeBalance()
  const unlockTimestamp = useTargetUnlockTime(
    Number(cakeLockWeeks) * WEEK,
    cakeLockExpired ? undefined : Number(cakeUnlockTime),
  )

  const veCakeAmount = useMemo(() => {
    const unlockTimeInSec =
      currentTimestamp > unlockTimestamp ? 0 : new BigNumber(unlockTimestamp).minus(currentTimestamp).toNumber()

    const endTimeInSec = currentTimestamp > endTime ? 0 : new BigNumber(endTime).minus(currentTimestamp).toNumber()

    if (status === CakeLockStatus.NotLocked) {
      const cakeAmountBN = getDecimalAmount(new BigNumber(cakeLockAmount))
      const veCakeAmountFromNative = cakeAmountBN.isNaN()
        ? 0
        : getVeCakeAmount(cakeAmountBN.toString(), unlockTimeInSec)
      return getBalanceAmount(proxyVeCakeBalance.plus(veCakeAmountFromNative))
    }

    if (viewMode === VeCakeModalView.WEEKS_FORM_VIEW) {
      return getBalanceAmount(
        proxyVeCakeBalance.plus(getVeCakeAmount(nativeCakeLockedAmount.toString(), unlockTimeInSec)),
      )
    }

    return getBalanceAmount(veCakeBalance).plus(getVeCakeAmount(cakeLockAmount, endTimeInSec))
  }, [
    currentTimestamp,
    unlockTimestamp,
    endTime,
    status,
    viewMode,
    veCakeBalance,
    cakeLockAmount,
    proxyVeCakeBalance,
    nativeCakeLockedAmount,
  ])

  const previewVeCake = useMemo(
    () => (veCakeAmount?.lt(0.1) ? veCakeAmount.sd(2).toString() : veCakeAmount?.toFixed(2)),
    [veCakeAmount],
  )

  const valid = useMemo(
    () => new BigNumber(veCakeAmount).gte(getBalanceAmount(new BigNumber(thresholdLockAmount))),
    [thresholdLockAmount, veCakeAmount],
  )

  return (
    <SnapShotTimeContainer $isValid={valid}>
      <Flex flexDirection={['column', 'column', 'column', 'row']} justifyContent={['space-between']}>
        <Box>
          <Text bold as="span" color="textSubtle" fontSize={12}>
            {t('Preview of')}
          </Text>
          <Text bold as="span" color="secondary" ml="4px" fontSize={12}>
            {t('*veCAKE at snapshot time:')}
          </Text>
        </Box>
        <Text>{timeFormat(locale, endTime)}</Text>
      </Flex>
      <Flex justifyContent={['space-between']}>
        <Flex>
          <Box width={39}>
            <Image
              width={39}
              height={39}
              alt="trading-reward-vecake"
              src={`${ASSET_CDN}/web/vecake/token-vecake-with-time.png`}
            />
          </Box>
          <Text style={{ alignSelf: 'center' }} bold ml="8px" fontSize="20px">
            {`${t('veCAKE')}⌛`}
          </Text>
        </Flex>
        <Flex>
          <Text bold mr="4px" fontSize="20px" color={valid ? 'text' : 'warning'} style={{ alignSelf: 'center' }}>
            {previewVeCake}
          </Text>
          {valid ? <CheckmarkCircleFillIcon color="success" width={24} /> : <ErrorIcon color="warning" width={24} />}
        </Flex>
      </Flex>
      {valid ? (
        <Text fontSize={14} mt="8px" bold textAlign="right" color="success">
          {t('Min. veCAKE will be reached at snapshot time')}
        </Text>
      ) : (
        <Text fontSize={14} mt="8px" bold textAlign="right" color="warning">
          {t('Min. veCAKE won’t be reached at snapshot time')}
        </Text>
      )}
    </SnapShotTimeContainer>
  )
}
