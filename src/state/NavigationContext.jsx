import { createContext, useContext } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ value, children }) {
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation() {
  return (
    useContext(NavigationContext) ?? {
      navigate: () => {},
      openGame: () => {},
      openTool: () => {},
      openCustomize: () => {},
      openSearch: () => {},
      route: { page: 'home', param: null },
    }
  )
}
