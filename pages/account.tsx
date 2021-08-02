import React, { useState, useEffect, useMemo, ChangeEvent } from 'react'
import { useRouter } from 'next/router'
// import Moralis from 'moralis'
import { useMoralis } from 'react-moralis'
import Head from 'next/head'
import { Md5 } from 'md5-typescript'
// import { isValid } from 'date-fns'
import { PersonalAccount, BusinessAccount, AccountType } from '../interfaces'
import AccountSettingsNavBar from '../components/main/account/AccountSettingsNavBar'
import PersonalAccountSettings from '../components/main/account/PersonalAccountSettings'
import BusinessAccountSettings from '../components/main/account/BusinessAccountSettings'
import Button from '../components/core/Button'
import Notification from '../components/constants/Notification'
import save_updates_icon from '../assets/images/general_icons/Save.png'
import { personaVerify, getPersonaInquiry } from '../utils/persona/personaEmbed'
import { encryptAES, decryptAES } from '../utils/ipfs/uploadEncryptedFiles'

const styles = {
  gray_input:
    'rounded bg-input-background py-3 px-3 text-xs placeholder:text-gray-400',
  gray_input_label: 'text-orange-FIDIS font-semibold block mb-2',
}

const initialPersonalAccount: PersonalAccount = {
  firstName: '',
  lastName: '',
  personalEmail: '',
  birthdayYear: '2022',
  birthdayMonth: '1',
  birthdayDay: '1',
  nationality: 'American',
  idType: 'Passport',
  idNumber: '',
  idPhotoURL: '',
  idPhotoName: '',
  profilePhotoURL: '',
  profilePhotoName: '',
  houseNo: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
}
const initialBusinessAccount: BusinessAccount = {
  ...initialPersonalAccount,
  companyName: '',
  ein: '',
  companyEmail: '',
  companyHouseNo: '',
  companyStreet: '',
  companyCity: '',
  companyState: '',
  companyZipCode: '',
  companyCountry: '',
}

const User = ({ profilePhotoIPFS, setProfilePhotoIPFS, profilePhotoURL, setProfilePhotoURL }: any) => {
  /* 
  variables:
    - user: the user object, contains all info about the current user
    - setUserData: to set/update user data in Moralis database
    - isUserUpdating: used to show loading state when the user clicks 'Save Info'
    - userError: used to show error message when the user clicks 'Save Info'
  */
  const {
    user,
    account,
    isAuthenticated,
    isAuthUndefined,
    setUserData,
    isUserUpdating,
    userError,
  } = useMoralis()
  //// define the account type Personal/Business
  const [accountType, setAccountType] = useState(AccountType.Personal)
  const [notificationError, setNotificationError] = useState(
    !userError ? false : true
  )
  const [notificationMsg, setNotificationMsg] = useState(
    !userError ? '' : userError.message
  )
  const [personalAccount, setPersonalAccount] = useState<PersonalAccount>(
    initialPersonalAccount
  )
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount>(
    initialBusinessAccount
  )
  
  const router = useRouter()

  const isConnected = useMemo(
    () => account && isAuthenticated,
    [account, isAuthenticated]
  )

  /// this should execute only once, that's why it's separated, and not every time the user data changes
  // useEffect(() => {
  //   const fetch = async () => {
  //     const moralisData = await user.fetch()
  //   }

  //   if (user) fetch()
  // }, [])

  useEffect(() => {
    if (user && user.attributes) {
      const secKey = process.env.NEXT_PUBLIC_AES_SECRET
      let accType = user.attributes.accountType || ''
      accType = decryptAES(Buffer.from(accType), secKey).toString()
      accType = accType === 'Business' ? AccountType.Business : AccountType.Personal
      setAccountType(accType)
    }

    setTimeout(() => {
      if (isAuthUndefined || !isAuthenticated || !isConnected) {
        router.push('/')
      }
      // else router.back()
    }, 1000)
  }, [])

  useEffect(() => {
    if (!user) return

    const secKey = process.env.NEXT_PUBLIC_AES_SECRET
    if (accountType === AccountType.Business) {
      const entries = Object.keys(businessAccount).map((key) => ({
        [key]: decryptAES(Buffer.from(user.get(key) || ''), secKey).toString()
      }))

      let acc = initialBusinessAccount
      for (const entry of entries) {
        acc = {
          ...acc,
          ...entry,
        }
      }

      setBusinessAccount(acc)
    } else {
      const entries = Object.keys(personalAccount).map((key) => ({
        [key]: decryptAES(Buffer.from(user.get(key) || ''), secKey).toString()
      }))

      let acc = initialPersonalAccount
      for (const entry of entries) {
        acc = {
          ...acc,
          ...entry,
        }
      }

      setPersonalAccount(acc)
    }
  }, [user, isConnected, accountType])

  const writeDataToMoralis = async (
    accHash: string,
    fields: any,
    type: boolean
  ) => {
    if (!type) {
      await setUserData({ personaVerified: encryptAES(Buffer.from('0'), process.env.NEXT_PUBLIC_AES_SECRET).toString() })

      setNotificationError(true)
      setNotificationMsg('KYC/KYB verification failed!')
      setTimeout(() => {
        setNotificationError(false)
      }, 8000)

      return
    }

    if (!fields) return

    // Pull document files from the Persona
    console.log('persona fields', fields)

    let accountInfo =
      accountType === AccountType.Business ? businessAccount : personalAccount

    const birthDateArr = fields['birthdate'].value.split('-')
    if (accountType === AccountType.Business) {
      accountInfo = {
        ...accountInfo,
        firstName: fields['name-first'].value || '',
        lastName: fields['name-last'].value || '',
        personalEmail: fields['email-address'].value || '',
        birthdayYear: birthDateArr[0],
        birthdayMonth: birthDateArr[1],
        birthdayDay: birthDateArr[2],
        nationality: !fields['nationality'] ? '' : fields['nationality'].value,
        idType: fields['identification-class'].value || '',
        idNumber: fields['identification-number'].value || '',
        idPhotoURL: '',
        idPhotoName: '',
        profilePhotoURL: '',
        profilePhotoName: '',
        houseNo: fields['address-street-2'].value || '',
        street: fields['address-street-1'].value || '',
        city: fields['address-city'].value || '',
        state: !fields['address-state'] ? '' : fields['address-state'].value,
        zipCode: fields['address-postal-code'].value || '',
        country: fields['address-country-code'].value || '',
      }

      setBusinessAccount(accountInfo as BusinessAccount)
    } else {
      accountInfo = {
        ...accountInfo,
        firstName: fields['name-first'].value || '',
        lastName: fields['name-last'].value || '',
        personalEmail: fields['email-address'].value || '',
        birthdayYear: birthDateArr[0],
        birthdayMonth: birthDateArr[1],
        birthdayDay: birthDateArr[2],
        nationality: !fields['nationality'] ? '' : fields['nationality'].value,
        idType: fields['identification-class'].value || '',
        idNumber: fields['identification-number'].value || '',
        idPhotoURL: '',
        idPhotoName: '',
        profilePhotoURL: '',
        profilePhotoName: '',
        houseNo: fields['address-street-2'].value || '',
        street: fields['address-street-1'].value || '',
        city: fields['address-city'].value || '',
        state: !fields['address-state'] ? '' : fields['address-state'].value,
        zipCode: fields['address-postal-code'].value || '',
        country: fields['address-country-code'].value || '',
      }

      setPersonalAccount(accountInfo as PersonalAccount)
    }

    const birthDate = birthDateArr[0] + birthDateArr[1] + birthDateArr[2]

    const entries = Object.keys(accountInfo).map((key) => ({
      [key]: accountInfo[key],
    }))

    let acc = { personaVerified: '1', accountType: accountType === AccountType.Business ? 'Business' : 'Personal' }
    for (const entry of entries) {
      acc = {
        ...acc,
        ...entry,
      }
    }

    const homeAddress = `House No: ${acc['houseNo']}, Street: ${acc['street']}, City: ${acc['city']}, , State: ${acc['state']}, Zip code: ${acc['zipCode']}, Country: ${acc['country']}`

    if (accountType === AccountType.Business) {
      const companyAddress =
        accountType === AccountType.Business
          ? `House No: ${acc['companyHouseNo']}, Street: ${acc['companyStreet']}, City: ${acc['companyCity']}, , State: ${acc['companyState']}, Zip code: ${acc['companyZipCode']}, Country: ${acc['companyCountry']}`
          : ''

      acc = {
        ...acc,
        ...{ companyAddress: companyAddress },
      }
    }

    acc = {
      ...acc,
      ...{ birthDate: birthDate },
      ...{ homeAddress: homeAddress },
    }
    // console.log('acc plain', acc)
    let encEntries = {}
    for (const key of Object.keys(acc)) {
      encEntries = {
        ...encEntries,
        ...{[key]: encryptAES(Buffer.from(acc[key].toString() || ''), process.env.NEXT_PUBLIC_AES_SECRET).toString()},
      }
    }

    encEntries = {
      ...encEntries,
      ...{ fidisAccInfoHash: accHash },
    }

    // console.log('account info to store', encEntries)
    await setUserData(encEntries as any)

    setNotificationError(true)
    setNotificationMsg('Stored successfully')
    setTimeout(() => {
      setNotificationError(false)
    }, 8000)
  }

  const onPersonaErrorCallback = (accHash: string, status: any, code: any) => {
    // display msg
    writeDataToMoralis(accHash, undefined, false)
  }

  const onPersonaCancelCallback = (
    accHash: string,
    inquiryId,
    sessionToken
  ) => {
    // display msg
    writeDataToMoralis(accHash, undefined, false)
  }

  const onPersonaCompleteCallback = async (
    accHash: string,
    inquiryId: string,
    status: any,
    fields: any
  ) => {
    // if successfuly verified, open Buy/Sell dialog
    if (status === 'completed') {
      // Check verification status
      const inquiryData = await getPersonaInquiry(process.env.NEXT_PUBLIC_PERSONA_API_KEY, process.env.NEXT_PUBLIC_PERSONA_API_VERSION, inquiryId)
      // if (!inquiryData) {

      // } else {
      //   const jDataIncluded = (inquiryData as any).included
      //   console.log(jDataIncluded)
      //   const verificationType = jDataIncluded.type
      //   const verificationId = jDataIncluded.id
      //   const verificationStatus = jDataIncluded.attributes.status
      
        // console.log('verification status', verificationStatus)

        // write verification result and account info to Moralis database
        const verificationStatus = 'passed'
        if (verificationStatus === 'passed') {
          writeDataToMoralis(accHash, fields, true)
        } else {
          writeDataToMoralis(accHash, fields, false)
        }
      // }
    }
  }

  // the function to update the user info
  const handleUpdateUserInfo = async (e: any) => {
    e.preventDefault()

    let templateId = process.env.NEXT_PUBLIC_PERSONA_KYC_TEMPLATE_ID
    let updatedHashValue = ''

    let companyAddress = ''
    let birthDate = ''
    let homeAddress = ''
    let fieldValues

    // compare hash values
    if (accountType === AccountType.Personal) {
      birthDate = `${personalAccount.birthdayYear}-${personalAccount.birthdayMonth}-${personalAccount.birthdayDay}`

      homeAddress = `House No: ${personalAccount.houseNo}, Street: ${personalAccount.street}, City: ${personalAccount.city}, , State: ${personalAccount.state}, Zip code: ${personalAccount.zipCode}, Country: ${personalAccount.country}`
console.log(user.attributes.ethAddress +
  personalAccount.firstName +
  personalAccount.lastName +
  personalAccount.personalEmail +
  birthDate +
  personalAccount.nationality +
  personalAccount.idType +
  personalAccount.idNumber
)
      updatedHashValue = Md5.init(
        user.attributes.ethAddress +
          personalAccount.firstName +
          personalAccount.lastName +
          personalAccount.personalEmail +
          birthDate +
          personalAccount.nationality +
          personalAccount.idType +
          personalAccount.idNumber
      )
      console.log('new hash', updatedHashValue)
      fieldValues = personalAccount
    } else {
      companyAddress = `House No: ${businessAccount.companyHouseNo}, Street: ${businessAccount.companyStreet}, City: ${businessAccount.companyCity}, , State: ${businessAccount.companyState}, Zip code: ${businessAccount.companyZipCode}, Country: ${businessAccount.companyCountry}`

      birthDate = `${businessAccount.birthdayYear}-${businessAccount.birthdayMonth}-${businessAccount.birthdayDay}`

      homeAddress = `House No: ${businessAccount.houseNo}, Street: ${businessAccount.street}, City: ${businessAccount.city}, , State: ${businessAccount.state}, Zip code: ${businessAccount.zipCode}, Country: ${businessAccount.country}`

      templateId = process.env.NEXT_PUBLIC_PERSONA_KYB_TEMPLATE_ID

      updatedHashValue = Md5.init(
        user.attributes.ethAddress +
          businessAccount.firstName +
          businessAccount.lastName +
          businessAccount.personalEmail +
          birthDate +
          businessAccount.nationality +
          businessAccount.idType +
          businessAccount.idNumber +
          businessAccount.companyName +
          businessAccount.ein +
          businessAccount.companyEmail
      )

      fieldValues = businessAccount
    }

    const moralisData = await user.fetch()
    const verifiedHashValue = moralisData.get('fidisAccInfoHash')
    console.log('old hash', verifiedHashValue)
    let kycVerify = false
    if (
      verifiedHashValue === '' ||
      updatedHashValue === '' ||
      verifiedHashValue !== updatedHashValue
    )
      kycVerify = true

    if (kycVerify) {
      if (!templateId) {
        console.log('persona templateId is empty')
        return
      }

      personaVerify(
        templateId,
        updatedHashValue,
        fieldValues,
        onPersonaCompleteCallback,
        onPersonaErrorCallback,
        onPersonaCancelCallback
      )
    } else {
      console.log('persona - verified')
      await setUserData({ personaVerified: encryptAES(Buffer.from('1'), process.env.NEXT_PUBLIC_AES_SECRET).toString() })
    }

    // setNotificationError(true)
    // setNotificationMsg('Empty fields!')
    // setTimeout(() => {
    //   setNotificationError(false)
    //   setNotificationMsg('')
    // }, 8000)
  }

  const updateValue = (key: string, value: string | number | Date) => {
    if (accountType === AccountType.Personal) {
      setPersonalAccount({
        ...personalAccount,
        [key]: value,
      })
    } else {
      setBusinessAccount({
        ...businessAccount,
        [key]: value,
      })
    }
  }

  const handleSelectChange = (evt: ChangeEvent<HTMLSelectElement>) => {
    const { name: inputName, value } = evt.currentTarget
    updateValue(inputName, value)
  }

  const handleInputChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const { name: inputName, value } = evt.currentTarget
    updateValue(inputName, value)
  }

  return (
    <>
      <Head>
        <title>FIDIS - Account settings</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {user ? (
        <main className="container mx-auto h-full py-4 text-white">
          <AccountSettingsNavBar
            profilePhotoIPFS={profilePhotoIPFS}
            setProfilePhotoIPFS={setProfilePhotoIPFS}
            profilePhotoURL={profilePhotoURL}
            setProfilePhotoURL={setProfilePhotoURL}
            accountType={accountType}
            setAccountType={setAccountType}
            styles={styles}
          />
          <form className="h-[90%] overflow-y-auto">
            <section className="scrolltype flex max-h-[70%] flex-col gap-8 overflow-y-auto pr-8">
              {/* I removed the: relative -top-5 because it was causing the form to appear on the top of the button 'upload photo profile' */}
              <div className="flex">
                <div id="walletAddress">
                  <label
                    htmlFor="walletAddress"
                    className={styles.gray_input_label}
                  >
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    name="walletAddress"
                    id="walletAddress"
                    className={styles.gray_input + ' w-[320px] rounded-md p-4'}
                    placeholder={user.attributes.ethAddress}
                    disabled
                  />
                </div>
              </div>
              {accountType == AccountType.Personal ? (
                <PersonalAccountSettings
                  styles={styles}
                  accountInfo={personalAccount}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                />
              ) : (
                <BusinessAccountSettings
                  styles={styles}
                  accountInfo={businessAccount}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                />
              )}
            </section>

            <div id="save_changes" className="mt-6 flex w-full justify-between">
              <Button
                isLoading={isUserUpdating}
                onClick={handleUpdateUserInfo}
                background="orange-FIDIS"
                svg={save_updates_icon}
                text="Save Changes"
              />
              <Notification
                text={notificationMsg}
                color={notificationError ? 'red' : 'green'}
              />
            </div>
          </form>
        </main>
      ) : (
        <></>
      )}
    </>
  )
}

export default User
