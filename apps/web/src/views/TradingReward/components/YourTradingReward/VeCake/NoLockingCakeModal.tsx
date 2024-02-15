import { useTranslation } from '@pancakeswap/localization'
import { Box, Flex, InjectedModalProps, Modal, Text } from '@pancakeswap/uikit'
import { getBalanceAmount, getFullDisplayBalance } from '@pancakeswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { WEEK } from 'config/constants/veCake'
import React, { useMemo } from 'react'
import { useLockCakeData } from 'state/vecake/hooks'
import { styled } from 'styled-components'
import { DataRow } from 'views/CakeStaking/components/DataSet/DataBox'
import { NotLockingCard } from 'views/CakeStaking/components/LockCake/NotLocking'
import { useProxyVeCakeBalance } from 'views/CakeStaking/hooks/useProxyVeCakeBalance'
import { useTargetUnlockTime } from 'views/CakeStaking/hooks/useTargetUnlockTime'
import { useVeCakeAmount } from 'views/CakeStaking/hooks/useVeCakeAmount'

const ValueText = styled(Text)`
  font-size: 16px;
  font-weight: 400;
`

const SnapShotTimeContainer = styled(Flex)`
  width: 100%;
  flex-direction: column;
  padding: 16px 24px;
  border-radius: 24px;
  border: 2px dashed #e7e3eb;
  background-color: ${({ theme }) => theme.colors.tertiary};
`

const PreviewOfVeCakeSnapShotTime = () => {
  const valid = true

  return (
    <SnapShotTimeContainer>
      <Flex justifyContent={['space-between']}>
        <Box>
          <Text bold as="span" color="textSubtle" fontSize={12}>
            Preview of
          </Text>
          <Text bold as="span" color="secondary" ml="4px" fontSize={12}>
            *veCAKE at snapshot time:
          </Text>
        </Box>
        <Text>16 Feb 2024, 21:45</Text>
      </Flex>
    </SnapShotTimeContainer>
  )
}

export const NoLockingCakeModal: React.FC<React.PropsWithChildren<InjectedModalProps>> = ({ onDismiss }) => {
  const { t } = useTranslation()
  const { cakeLockAmount, cakeLockWeeks } = useLockCakeData()
  const unlockTimestamp = useTargetUnlockTime(Number(cakeLockWeeks) * WEEK)
  const cakeAmountBN = useMemo(
    () => getBalanceAmount(new BigNumber(Number(cakeLockAmount))).toString(),
    [cakeLockAmount],
  )
  const { balance: proxyVeCakeBalance } = useProxyVeCakeBalance()
  const veCakeAmountFromNative = useVeCakeAmount(cakeAmountBN, unlockTimestamp)

  const veCakeAmount = useMemo(
    () => proxyVeCakeBalance.plus(veCakeAmountFromNative),
    [proxyVeCakeBalance, veCakeAmountFromNative],
  )
  const veCake = veCakeAmount ? getFullDisplayBalance(new BigNumber(veCakeAmount), 18, 3) : '0'

  return (
    <Modal title="Lock CAKE to get veCAKE" maxWidth={777} onDismiss={onDismiss}>
      <NotLockingCard
        hideTitle
        hideCardPadding
        customVeCakeCard={<PreviewOfVeCakeSnapShotTime />}
        customDataRow={
          <DataRow
            label={
              <Text fontSize={14} color="textSubtle" style={{ textTransform: 'initial' }}>
                {t('veCAKE')}
              </Text>
            }
            value={<ValueText>{veCake}</ValueText>}
          />
        }
      />
    </Modal>
  )
}
