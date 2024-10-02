import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import './index.css';
import { API_BASE_URL } from './api/config';
import Flag from 'react-world-flags';
import Select from 'react-select';
import axios from 'axios';
import eu from '../public/Flag_of_Europe.svg';
import { IoMdRefresh } from 'react-icons/io';
import { BiNoSignal } from "react-icons/bi";


import Home from './comp/Home';
import { FaSun, FaMoon } from 'react-icons/fa';
import { PiCurrencyBtcFill } from "react-icons/pi";
import { HiSwitchHorizontal } from "react-icons/hi";
import { FaExchangeAlt, FaMoneyBill, FaUniversity } from 'react-icons/fa';








function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [count, setCount] = useState(0)
  const [banks, setBanks] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState(banks?.length > 0 ? banks[0]?.id.toString() : '');
  const [selectedCurrency, setSelectedCurrency] = useState('usd');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Retrieve the user's preference from localStorage
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const now = new Date();
  const formattedDate = ` ${now.toLocaleDateString('en-US', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()}`;

  
   useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save the user's preference in localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };



  useEffect(() => {

    axios.get(`${API_BASE_URL}/banks-currencies`)
      .then(response => {
        setBanks(response.data.banks);
        setCurrencies(response.data.currencies);
      })
      .catch(error => {
        console.error('Error fetching banks and currencies:', error);
      });
  }, []);


  const handleSelect = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    setIsOpen(false); // Close the dropdown after selection
  };

  const handleConvert = () => {
    setLoading(true);
    axios.post(`${API_BASE_URL}/convert`, {
      amount,
      bankId: selectedBank,
      currencyName:selectedCurrency
    })
      .then(response => {
        setResult(response.data.convertedAmount);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error converting currency:', error);
        setLoading(false);
        alert('Error converting currency');
      });
  };
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };


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

  

console.log(currencies)



  return (
    <div className='max-w-screen min-w-screen bg-gray-200 dark:bg-gray-900'>

<nav className="fixed z-50 pt-1 top-0 left-0 bg-white max-h-24 min-h-24 max-w-screen min-w-screen border-gray-200 dark:bg-black">
  
      <div className="max-w-screen-lg  flex flex-wrap items-center justify-between mx-auto px-2 lg:px-4 py-1 pb-2">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <PiCurrencyBtcFill className='text-orange-500 text-4xl' />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Birr<span className='text-orange-500'>Live</span></span>
        </div>
        <div className="mt-1 ml-1.5 mr-1 xxxxsp:mt-0 xxxxsp:ml-0 flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">

        <button type="button" onClick={toggleVisibility} className=" text-white bg-orange-500 hover:bg-orange-800  font-medium md:mr-3 rounded-lg text-sm px-2 py-1 xxs:py-1.5  text-center flex items-center gap-1 "><div className='hidden xxs:block'>Converter</div><HiSwitchHorizontal className='text-lg' /></button>

      <div className="flex items-center pr-1   space-x-3">
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="text-gray-700 dark:text-gray-300 mx-3"
        >
          {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>

        <button style={{backgroundColor:isOnline?'':'red'}} onClick={reLoad} className=" active:text-2xl font-bold bg-gray-500   p-1    text-white flex justify-center items-center rounded-full h-6 w-6  text-lg"> <IoMdRefresh  /></button>

      </div>
    </div>
       
      </div>

      <h2 className="hidden xxxxsp:flex  px-1  text-base flex justify-center   min-h-5 max-h-5  font-extrabold tracking-tight  text-gray-900 dark:text-white">
            <div>Ethiopian Banks Daily Exchange Rates</div> 
        </h2>

          <span className='absolute bottom-0  right-4 lg:right-1/4    font-medium text-sm border-b border-orange-500  text-gray-700 dark:text-gray-300  '>{formattedDate}</span>
            

       

    </nav>


    
    <div className='max-h-16 min-h-16 max-w-screen min-w-screen'></div>


   


    <div style={{ display: isVisible ? '' : 'none' }} className="fixed max-w-90% min-w-90% sm:min-w-500 -top-5 z-50 left-1/2 -translate-x-1/2 mx-auto mt-10 p-6 border border-gray-200 rounded-lg shadow-md bg-white dark:bg-gray-900 dark:border-gray-700">
      <button
        type="button"
        className="absolute top-2 right-3 font-bold rounded text-black dark:text-white"
        onClick={toggleVisibility}
      >
        X
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center justify-center min-w-100%">
          <h2 className="mr-2 text-xl font-bold text-black dark:text-white">Convert</h2>
          <HiSwitchHorizontal className="text-xl font-bold text-orange-500 dark:text-white" />
        </div>
      </div>

      <div className="space-y-4  min-w-100%">
        <div className="form-group">
          <label className="block font-bold text-sm mb-2 text-black dark:text-white">Amount</label>
          <div className="flex items-center border border-gray-300 rounded px-3 py-2 dark:border-gray-600">
            <FaMoneyBill className="mr-2 text-gray-500 dark:text-gray-300" />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 outline-none bg-white dark:bg-gray-900 text-black dark:text-white"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="block font-bold text-sm mb-2 text-black dark:text-white">Currency</label>
          <div className="flex items-center border border-gray-300 rounded px-3 py-2 dark:border-gray-600">
            <FaExchangeAlt className="mr-2 text-sm text-gray-500 dark:text-gray-300" />
            <div className="relative text-sm inline-block w-full">
      <div
        onClick={handleToggle}
        className="flex text-sm items-center justify-between p-2 border border-gray-300 rounded cursor-pointer  text-black dark:text-white"
      >
        <div className="flex items-center uppercase">
          {selectedCurrency && (
            <Flag
              code={currencies.find(currency => currency.code === selectedCurrency)?.country_code}
              className="inline-block mr-2 min-h-5 max-h-5 min-w-10 max-w-10 uppercase"
            />
          )}
          {selectedCurrency}
        </div>
        <span className="ml-2">&#9660;</span> {/* Dropdown arrow */}
      </div>
      {isOpen && (
        <div className="absolute text-sm z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 rounded shadow-lg">
          {currencies.map(currency => (
            <div
              key={currency.name}
              onClick={() => (handleSelect(currency.name),setIsOpen(false))}
              className="flex text-sm items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Flag
                code={currency.country_code}
                className="inline-block mr-2 min-h-5 max-h-5 min-w-10 max-w-10 uppercase"
              />
              {currency.country_code.toLocaleLowerCase() === 'eu' && (
                <img
                  src={eu}
                  alt="EU Flag"
                  className="inline-block mr-2 min-h-5 max-h-5 min-w-10 max-w-10 uppercase"
                />
              )}
              <div onClick={() =>(setSelectedCurrency(currency.name),setIsOpen(false))} className="inline-block text-gray-600 dark:text-white mr-2 min-h-5 max-h-5 min-w-10 max-w-10 uppercase">{currency.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
          </div>
        </div>

       

        <div className="form-group text-sm ">
          <label className="block font-bold mb-2 text-black dark:text-white">Bank</label>
          <div className="flex items-center border border-gray-300 rounded px-3 py-2 dark:border-gray-600">
            <FaUniversity className="mr-2  text-gray-500 dark:text-gray-300" />
            <select
  value={selectedBank}
  onChange={e => setSelectedBank(e.target.value)}
  className="capitalize   flex-1 outline-none bg-white dark:bg-gray-900 max-w-full text-black dark:text-white "
>
  <option value="" >Select a bank</option>
  {banks.map(bank => (
    <option  key={bank.id} value={bank.id.toString()}>
      {bank.name.toLocaleLowerCase()}
    </option>
  ))}
</select>

          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={loading}
          className="w-full bg-orange-500 text-white font-bold py-2 rounded hover:bg-orange-600 transition-colors"
        >
          {loading ? 'Converting...' : 'Convert'}
        </button>

        


<div id="toast-simple" style={{display:result!=null?'':'none'}} className="mx-auto flex justify-center items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-800" role="alert">
{result && <div className="ps-4 text-lg flex flex-wrap font-normal">Converted Amount: <div className='text-green-500 mr-1'>{result}</div>Birr</div>}
</div>

      </div>
    </div>
      
        



    <footer className="w-full fixed bottom-0 left-0 z-40 bg-white dark:bg-black  shadow">
  <div className="w-full max-w-screen-xl mx-auto p-4 flex flex-col items-center justify-center md:flex-row">
    <span className="text-sm text-gray-500 dark:text-gray-400 text-center ">
      © 2024 <a href="#" className="hover:underline">Birr<span className='text-orange-500'>Live</span></a>. All Rights Reserved.
    </span>
    <span className="text-sm text-gray-500 dark:text-gray-300 mt-2 md:mt-0 text-center ml-2 ">
      Developed By <a href="https://flexdivs.com/" className="text-orange-500 hover:underline">FlexDiv</a>
    </span>
  </div>
</footer>
     
      <Router>
      <Routes>
             
              <Route path="/" element={<Home/>} />


      
            </Routes>
      </Router>

    </div>
  )
}

export default App
