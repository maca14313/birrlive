import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import Flag from 'react-world-flags';
import { IoMdRefresh } from 'react-icons/io';
import { BiNoSignal } from "react-icons/bi";
import { HiSwitchHorizontal } from "react-icons/hi";
import { FaExchangeAlt, FaMoneyBill, FaUniversity } from 'react-icons/fa';
import { BsSortDown } from "react-icons/bs";

import eu from '../../public/Flag_of_Europe.svg';

function Home() {
  const [isOnline, setIsOnline] = useState(true);
  const [banks, setBanks] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [onCurrencies, setOnCurrencies] = useState('usd');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reLoadingBanksWithCurrencies, setReLoadingBanksWithCurrencies] = useState(true);
  const [sortBy, setSortBy] = useState(0);


  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/banks-with-currencies`)
      .then((response) => {
        setBanks(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch data.');
        setLoading(false);
      });
  }, [reLoadingBanksWithCurrencies]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/currencies`)
      .then((response) => {
        setCurrencies(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch data.');
        setLoading(false);
      });
  }, []);

  const now = new Date();
  const formattedDate = ` ${now.toLocaleDateString('en-US', { month: 'long' })} ${now.getDate()}, ${now.getFullYear()}`;

  const uniqueCurrencies = Array.from(new Set(currencies.map((c) => c.name))).map((name) => {
    return currencies.find((c) => c.name === name);
  });

  const checkInternetConnection = async () => {
    try {
      // Fetch a small resource from a reliable server
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1', {
        method: 'GET',
        cache: 'no-store',
      });
     console.log(response.ok)
      if (response.ok) {
        window.location.reload(true)
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      setIsOnline(false);
    }
  };

  const reLoad = () => {
     setIsOnline(true)
    checkInternetConnection()  
  };


  
  

  if (loading)
    return (
      <p className='min-h-screen pb-36 max-h-screen min-w-screen max-w-screen flex justify-center items-center'><h1 className='text-xl font-semibold text-gray-500'>Loading...<div onClick={reLoad} className="  text-gray-400 flex justify-center  rounded-full mt-1 p-1 text-4xl">
      <div role="status"  onClick={reLoad}>
    <svg aria-hidden="true" className="w-9 h-9 mt-3 text-gray-200 animate-spin dark:text-gray-600 fill-orange-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span className="sr-only">Loading...</span>
</div>
      
       </div>
      
      </h1>
      </p>
    );
  if (error)
    return (
      <p className='min-h-screen pb-36 max-h-screen min-w-screen max-w-screen flex justify-center items-center'><h1 className='text-xl font-semibold text-gray-500'>Network Error <div onClick={reLoad} className="  text-gray-400 flex justify-center  rounded-full mt-1 p-1  text-4xl">
      <IoMdRefresh /> </div> </h1>
      </p>
    );

  // Sort banks by highest buying rate
  const sortedBanks = banks.sort((a, b) => {
    // Find the buying rate for the specified currency in each bank
    const currencyA = a.currencies.find((currency) => currency.name.toLocaleLowerCase() === onCurrencies.toLocaleLowerCase());
    const currencyB = b.currencies.find((currency) => currency.name.toLocaleLowerCase() === onCurrencies.toLocaleLowerCase());

    // Compare the buying rates, handling cases where the currency might not be present
    //const buyingRateA = currencyA ? currencyA.buying : 0;
    //const buyingRateB = currencyB ? currencyB.buying : 0;

    const buyingRateA = currencyA ? sortBy==0?currencyA.selling:currencyA.buying : 0;
    const buyingRateB = currencyB ? sortBy==0?currencyB.selling:currencyB.buying : 0;

    return buyingRateB - buyingRateA;
  });

  return (
    <div className="relative min-h-screen pb-10 bg-gray-100 dark:bg-gray-900 max-w-full min-w-full">
     <div className="container mx-auto  lg:px-16 max-w-full min-w-full">
        {/* Tabs Section */}
        <div className="max-w-100% min-w-100% min-h-screen ">
          <div className="container mx-auto  lg:px-16 max-w-100% min-w-100%">

         
        
          <div className='sticky px-2   top-24 pt-1.5  z-40 bg-gray-100 dark:bg-gray-900'>
         


            {/* Tabs Section */}
            {uniqueCurrencies.length > 0 ? (
              <ul className="max-w-100% min-w-100% flex gap-7  py-1  overflow-x-scroll text-sm font-medium text-center text-gray-500 border-b border-gray-500 dark:border-gray-700 dark:text-gray-400">
                {uniqueCurrencies.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => setOnCurrencies(c.name)}
                    className={`cursor-pointer px-2 pt-1 pb-0.5   flex items-end min-w-max  me-2 transition-colors duration-300 ${
                      onCurrencies.toLocaleLowerCase() === c.name.toLocaleLowerCase()
                        ? 'border  bg-blue-200 text-black dark:text-black dark:border-white dark:bg-blue-200'
                        : ''
                    }`}
                  >
                    {c.country_code.toLocaleLowerCase() === 'eu' && (
                      <img src={eu} alt="EU Flag" className="inline-block mr-2 min-h-5 max-h-5  min-w-10 max-w-10 uppercase" />
                    )}
                    <Flag code={c.country_code} className="inline-block mr-2 min-h-5 max-h-5  min-w-10 max-w-10  uppercase" />
                    <div className="uppercase text-base min-h-5 max-h-5 ">{c.name}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No currencies available</p>
            )}
            </div>
            {/* Table Section */}

           
            <section className="relative max-w-full mt-8 mx-2  mb-7  bg-white dark:bg-gray-800  shadow-md overflow-x-auto">
            
              <table className="min-w-full bg-gray-50 dark:bg-gray-800 table-fixed">
                <thead>
                  <tr className="bg-orange-500 dark:bg-orange-500 text-xs uppercase border-b dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm text-white w-1/3">Bank</th>
                    <th className="px-1 py-3 text-left text-sm text-white w-1/3  "> <div  onClick={()=>(setSortBy(1))}  className='flex'><BsSortDown style={{color:sortBy==1?'yellow':'black'}} />Buying</div> </th>
                    <th className="px-1 py-3 text-left text-sm text-white w-1/3 "> <div   onClick={()=>(setSortBy(0))} className='flex'><BsSortDown style={{color:sortBy==0?'yellow':'black'}}/>Selling</div> </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBanks.length > 0 ? (
                    sortedBanks.map((bank, index) => (
                      <tr key={bank.id} className="border-t border-b dark:border-gray-700" style={{ backgroundColor: index % 2 === 1 ? '' : '' }}>
                        <td className="px-4 py-4 font-medium text-sm text-gray-900 dark:text-white">
                          {bank.name.toLocaleUpperCase()}
                        </td>
                        {bank.currencies.length > 0 ? (
                          bank.currencies.map((currency) => (
                            <React.Fragment key={currency.id}>
                              <td
                                style={{
                                  display: onCurrencies.toLocaleLowerCase() === currency.name.toLocaleLowerCase() ? '' : 'none',
                                }}
                                className="px-1 py-4 text-sm text-black dark:text-white"
                              >
                                {currency.buying == 0.0000 ? '--' : parseFloat(currency.buying).toFixed(4)}
                              </td>
                              <td
                                style={{
                                  display: onCurrencies.toLocaleLowerCase() === currency.name.toLocaleLowerCase() ? '' : 'none',
                                }}
                                className="px-1 py-4 text-sm text-black dark:text-white"
                              >
                                {currency.selling == 0.0000 ? '--' : parseFloat(currency.selling).toFixed(4)}
                              </td>
                            </React.Fragment>
                          ))
                        ) : (
                          <>
                            <td className="px-6 py-4 text-sm text-black dark:text-white">--</td>
                            <td className="px-6 py-4 text-sm text-black dark:text-white">--</td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No banks available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

            </section>

            <p className='px-1 mb-24 text-sm text-center  text-gray-600 dark:text-gray-400'>Notice: Exchange rates are sourced from Ethiopian banks. Please verify before any transactions.</p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;