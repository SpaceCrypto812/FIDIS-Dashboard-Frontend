import React, { useMemo, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { useIndexPrices, useBalances } from '../../../state/application/hooks'
import { getBalanceNumber } from '../../../utils/balance'
import { DefaultIndexDecimals } from '../../../config/types'

ChartJS.register(ArcElement, Tooltip, Legend)

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
}

const initialPieChartData = {
  labels: ['FI25', 'GoldFI', 'MetaFI', 'NFTFI', 'GameFI', 'DeFiFI'],
  datasets: [
    {
      label: '# of Votes',
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: [
        'rgba(111, 159, 198, 1)',
        'rgba(243, 168, 101, 1)',
        'rgba(127, 185, 115, 1)',
        '#38bdf8',
        '#fbbf24',
        '#c084fc',
      ],
      borderColor: [
        'rgba(111, 159, 198, 1)',
        'rgba(243, 168, 101, 1)',
        'rgba(127, 185, 115, 1)',
        '#38bdf8',
        '#fbbf24',
        '#c084fc',
      ],
      borderWidth: 1,
    },
  ],
}

const Distribution = () => {
  const [pieDataType, setPieDataType] = useState<string>('Balance')

  const indexBalances = useBalances()
  const indexPrices = useIndexPrices()

  let pieChartData = useMemo(() => {
    let pieData = initialPieChartData
    initialPieChartData.labels.map((key, index) => {
      const balance = indexBalances[key] // wei
      const ethBal = getBalanceNumber(balance, DefaultIndexDecimals[key])
      if (pieDataType === 'Balance') {
        pieData.datasets[0].data[index] = ethBal /* Number(ethBal.toFixed(3))*/
      } else {
        pieData.datasets[0].data[index] =
          ethBal * Number(indexPrices[key].price) /* Number((
          ethBal * Number(indexPrices[key].price)
        ).toFixed(1))*/
      }
    })

    return pieData
  }, [indexBalances, indexPrices, pieDataType])

  if (!pieChartData) pieChartData = initialPieChartData

  const handleBalanceToggle = () => {
    setPieDataType((p) => (p === 'Balance' ? 'Value' : 'Balance'))
  }

  return (
    <div className="col-span-4 w-full rounded bg-black/30 py-2 px-3">
      <nav className="flex items-center justify-between border-b border-gray-300/30 py-2">
        <h1 className="text-xl font-medium">Distribution</h1>
      </nav>
      {/* <h2 className="py-3 text-sm">FI25 Crypto Index Token</h2> */}
      <div className="grid h-3/4 grid-rows-1 pt-8 ">
        <Pie data={pieChartData} options={options} />
      </div>
      <div className="flex justify-end">
        <label
          htmlFor="value_balance"
          className="relative mt-2 flex cursor-pointer items-center hover:scale-105"
        >
          <span className="mr-1.5 cursor-pointer text-sm font-medium">
            Balance
          </span>
          <div className="relative">
            <input
              onClick={handleBalanceToggle}
              type="checkbox"
              id="value_balance"
              className="sr-only cursor-pointer"
            />
            <div className="toggle_bg h-5 w-8 cursor-pointer rounded-full border-2 border-gray-200 bg-transparent"></div>
          </div>

          <span className="ml-1.5 cursor-pointer text-sm font-medium">
            Value
          </span>
        </label>
      </div>
    </div>
  )
}

export default Distribution
