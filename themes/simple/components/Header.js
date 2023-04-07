import BLOG from '@/blog.config'
import { useRouter } from 'next/router'
import CONFIG_SIMPLE from '../config_simple'
import SocialButton from './SocialButton'
import React from 'react'

/**
 * 网站顶部
 * @returns
 */
export const Header = (props) => {
  const { siteInfo } = props
  const avatar = siteInfo?.icon || BLOG.AVATAR
  const router = useRouter()

  return (
        <header className="text-center justify-between items-center px-6 bg-white h-80 dark:bg-black relative z-10">
            <div className="float-none inline-block py-12">
                <div className='flex space-x-6'>
                    <div className='hover:rotate-45 hover:scale-125 transform duration-200 cursor-pointer' onClick={() => router.push('/')}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatar} className='rounded-full' width={160} alt={BLOG.AUTHOR} />
                    </div>

                    <div>
                        <div className='text-3xl font-serif dark:text-white py-2 hover:scale-105 transform duration-200'>{BLOG.AUTHOR}</div>
                        <div className='font-light dark:text-white py-2 hover:scale-105 transform duration-200 text-center' dangerouslySetInnerHTML={{ __html: CONFIG_SIMPLE.LOGO_DESCRIPTION }}/>
                        <SocialButton />
                    </div>
               </div>

                <div className='text-xs mt-4 text-gray-500 dark:text-gray-300'>{siteInfo?.description}</div>
            </div>
        </header>
  )
}
