import classNames from 'classnames'
/**
 * Screen
 * - Screen 컴포넌트는 화면 전체를 차지하는 컴포넌트입니다.
 * @param {string} header
 * @param {boolean} nav
 * @param {ReactNode} children
 * @returns {ReactNode}
 * @example
 * <Screen>
 *  <div>Content</div>
 * </Screen>
 * @example
 * <Screen nav>
 *  <div>Content</div>
 * </Screen>
 * @example
 * <Screen header={{ title: "제목" }}>
 * <div>Content</div>
 * </Screen>
 */

export interface ScreenProps {
  nav?: boolean
  isFixed?: boolean
  children: React.ReactNode
  className?: string
}

export const Screen = ({ nav, isFixed, children, className, ...rest }: ScreenProps) => {
  const baseScreenClasses = 'w-full h-dvh'

  return (
    <div
      className={classNames(
        baseScreenClasses,
        nav ? `` : `pb-safe`,
        isFixed ? `overflow-y-hidden` : `overflow-y-scroll`,
        className ? className : `bg-transparent`,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
