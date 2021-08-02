import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useMoralis, useMoralisFile } from 'react-moralis'
import Moralis from 'moralis'
import { arrayBufferToBuffer } from 'arraybuffer-to-buffer'
import FileSaver from 'file-saver'
import { /*ipfs, */ retrieveFileContent } from '../../../utils/ipfs/ipfs'
import { encryptAES, decryptAES } from '../../../utils/ipfs/uploadEncryptedFiles'


const AccountSettingsNavBar = ({
  accountType,
  setAccountType,
  styles,
  profilePhotoIPFS,
  setProfilePhotoIPFS,
  profilePhotoURL,
  setProfilePhotoURL,
}) => {
  const { user, isAuthenticated } = useMoralis()
  const { saveFile } = useMoralisFile()

  const profilePictureRef = useRef<HTMLInputElement>()
  const [loadingImage, setLoadingImage] = useState(false)
  const [profilePhotoName, setProfilePhotoName] = useState(user.attributes.profilePhotoName)

  useEffect(() => {
    const fetchFileContent = async() => {
      // const res = await retrieveFileContent(profilePhotoIPFS)
      // const decryptedData = decryptAES(Buffer.from(res), process.env.NEXT_PUBLIC_AES_SECRET)

      // const blob = new Blob([ decryptedData ], { type: 'image/jpeg' });
      const localURL = user.attributes.profilePhotoName
      console.log('localURL', localURL)
      // FileSaver.saveAs(blob, localURL);

      // setProfilePhotoURL(localURL)
    }
    if (profilePhotoIPFS && profilePhotoIPFS !== '/profilePhotoDefault.png') {
      fetchFileContent()
    }
  }, [profilePhotoIPFS])

  const getClickedButton = (e) => {
    setAccountType(e.target.innerText)
  }

  const handleUploadProfileImage = async (e) => {
    e.preventDefault()

    // if the user click upload, then canceled, return nothing
    if (
      !profilePictureRef.current.files ||
      !profilePictureRef.current.files.length
    )
      return

    // catch the first file in the file list (image) (only one file allowed)
    const file = profilePictureRef.current.files[0]

    // create a new Moralis file instance containing the image name and actual image metadata
    let originArrBuffer = await file.arrayBuffer()
    const originBuffer = arrayBufferToBuffer(originArrBuffer)
    const secKey = process.env.NEXT_PUBLIC_AES_SECRET
    const encodedBuffer = encryptAES(originBuffer, secKey)

    // const authorization = "Basic " + process.env.NEXT_PUBLIC_IPFS_PROJECT_ID + ':' + process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET

    // const result = await ipfs.add(encodedBuffer)

    setLoadingImage(true)

    try {
      // user.set('profilePhotoURL', result.path)

      let resultMoralis = ''
      const base64Buf = Buffer.from(encodedBuffer).toString('base64')
      
      await saveFile(
        file.name,
        { base64: base64Buf },
        {
          type: 'base64',
          saveIPFS: true,
          onSuccess: (result) => {
            resultMoralis = result['_hash']
            // console.log(resultMoralis)
          },
          onError: (error) => {
            console.log(error)
          },
        }
      )

      const encryptedHash = encryptAES(Buffer.from(resultMoralis), secKey)
      user.set('profilePhotoURL', encryptedHash)
      user.set('profilePhotoName', file.name)
      await user.save()

      // setProfilePhotoIPFS(result.path)
      setProfilePhotoIPFS(encryptedHash)
      setProfilePhotoName(file.name)
    } catch (error) {
      console.log(error)
    }

    setLoadingImage(false)
  }

  useEffect(() => {
    /// update the profile picture from the default to the one in Moralis database if it exists
    if (!isAuthenticated) return
    if (user && user.attributes.profilePhotoURL) {
      try {
        setProfilePhotoIPFS(`${user.attributes.profilePhotoURL}`)
      } catch (error) {
        console.log(error)
      }
    }
  }, [user, isAuthenticated])
  return (
    <nav className="-mb-2 flex items-start justify-between">
      <div className="mt-10 flex items-center gap-10">
        <h1 className="text-xl">Account Details</h1>
        <div>
          <button
            onClick={(e) => getClickedButton(e)}
            className={`border border-orange-FIDIS ${
              accountType == 'Personal' ? 'bg-orange-FIDIS' : 'bg-transparent'
            } px-4 py-1 text-sm font-medium xxl:py-4 xxl:px-6`}
          >
            Personal
          </button>
          <button
            onClick={(e) => getClickedButton(e)}
            className={`border border-orange-FIDIS  ${
              accountType == 'Business' ? 'bg-orange-FIDIS' : 'bg-transparent'
            } px-4 py-1 text-sm font-medium xxl:py-4 xxl:px-6`}
          >
            Business
          </button>
        </div>
      </div>
      <div className="mr-12 mt-4 flex flex-col items-center justify-center gap-2">
        <div
          className={`relative h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-solid border-orange-FIDIS text-center hover:opacity-[0.8] ${
            loadingImage ? ' cursor-wait blur-sm' : 'cursor-pointer'
          }`}
        >
          <Image
            src={profilePhotoURL}
            height={120}
            width={120}
            alt=""
            className={`object-cover object-center`}
          />
          <input
            disabled={loadingImage}
            onChange={handleUploadProfileImage}
            type="file"
            accept="image/*"
            id="profilePhotoURL"
            name="profilePhotoURL"
            className={`
              ${styles.gray_input}
              z-999 absolute -top-16 -left-16 h-[300px] w-[300px] cursor-pointer  opacity-0
              ${loadingImage && 'cursor-wait opacity-0'}
            `}
            ref={profilePictureRef}
          />
        </div>
        {
          <div className={`${loadingImage ? 'opacity-1' : 'opacity-0'}`}>
            Uploading...
          </div>
        }
      </div>
    </nav>
  )
}

export default AccountSettingsNavBar
