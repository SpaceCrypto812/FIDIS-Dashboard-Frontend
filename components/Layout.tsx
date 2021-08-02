import React, { useState } from 'react'
import NavBar from './navbar'

const Layout = ({ children }: any) => {
  const [profilePhotoIPFS, setProfilePhotoIPFS] = useState(
    '/profilePhotoDefault.png'
  )
  const [profilePhotoURL, setProfilePhotoURL] = useState('/profilePhotoDefault.png')

  return (
    <div className="container mx-auto flex h-screen min-w-[1200px] overflow-x-auto overflow-y-hidden">
      <div className="my-auto mx-auto flex h-[90%] max-h-[700px] max-w-[1200px] flex-auto gap-7 rounded bg-overlay-background pl-8 pr-4 shadow-lg xxl:max-h-[1600px] xxl:max-w-[2000px] ">
        <NavBar
          setProfilePhotoIPFS={setProfilePhotoIPFS}
          profilePhotoURL={profilePhotoURL}
        />
        {React.cloneElement(children, {
          profilePhotoIPFS: profilePhotoIPFS,
          setProfilePhotoIPFS: setProfilePhotoIPFS, 
          profilePhotoURL: profilePhotoURL, 
          setProfilePhotoURL: setProfilePhotoURL
        })}
      </div>
    </div>
  )
}

export default Layout
