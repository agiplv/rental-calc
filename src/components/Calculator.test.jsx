import React, { Fragment, act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('framework7-react', () => {
  const frameworkSpecificProps = new Set([
    'animated',
    'accordionItem',
    'bottom',
    'clearButton',
    'deleteable',
    'fill',
    'inset',
    'labels',
    'large',
    'mediaList',
    'noHairlinesBetween',
    'noMarginBottom',
    'noMarginTop',
    'position',
    'right',
    'small',
    'swipeout',
    'swipeable',
    'tabbar',
    'tabLink',
    'tabActive',
    'tabLinkActive',
    'delete',
  ])

  const cleanProps = props =>
    Object.fromEntries(
      Object.entries(props).filter(
        ([key, value]) =>
          value !== undefined && !frameworkSpecificProps.has(key)
      )
    )

  const wrap = Component => {
    const Wrapped = ({ children, ...props }) => <Component {...cleanProps(props)}>{children}</Component>
    Wrapped.displayName = `Mock${typeof Component === 'string' ? Component : 'Component'}`
    return Wrapped
  }

  const TAB_STORE_KEY = '__f7MockTabStore'
  const tabStore = globalThis[TAB_STORE_KEY] || {
    currentTab: '#tab-calc',
    subscribers: new Set(),
  }
  globalThis[TAB_STORE_KEY] = tabStore

  const setCurrentTab = tab => {
    tabStore.currentTab = tab
    tabStore.subscribers.forEach(subscriber => subscriber(tab))
  }

  const useTabState = () => {
    const [activeTab, setActiveTab] = React.useState(tabStore.currentTab)

    React.useEffect(() => {
      tabStore.subscribers.add(setActiveTab)
      return () => tabStore.subscribers.delete(setActiveTab)
    }, [])

    return { activeTab, setActiveTab: setCurrentTab }
  }

  return {
    AccordionContent: ({ children }) => <Fragment>{children}</Fragment>,
    AccordionItem: wrap('div'),
    AccordionToggle: ({ children, ...props }) => <div {...cleanProps(props)}>{children}</div>,
    BlockTitle: ({ children }) => <h2>{children}</h2>,
    Button: ({ children, onClick, type = 'button', ...props }) => (
      <button type={type} onClick={onClick} {...cleanProps(props)}>
        {children}
      </button>
    ),
    Card: wrap('div'),
    CardContent: wrap('div'),
    CardHeader: wrap('div'),
    Chip: ({ text }) => <span>{text}</span>,
    Link: ({ children, onClick, tabLink, tabLinkActive, ...props }) => {
      const { setActiveTab } = useTabState()
      return (
        <button
          type="button"
          aria-pressed={tabLinkActive ? 'true' : 'false'}
          onClick={event => {
            if (tabLink) setActiveTab(tabLink)
            onClick?.(event)
          }}
          {...cleanProps(props)}
        >
          {children}
        </button>
      )
    },
    List: wrap('div'),
    ListInput: ({ label, type, value, onInput, placeholder, inputProps = {}, inputmode, children }) => {
      const InputTag = type === 'textarea' ? 'textarea' : 'input'
      return (
        <label>
          <span>{label}</span>
          <InputTag
            aria-label={label}
            inputMode={inputmode}
            onInput={onInput}
            placeholder={placeholder}
            value={value}
            {...(type === 'textarea' ? inputProps : { type, ...inputProps })}
          />
          {children}
        </label>
      )
    },
    ListItem: ({ title, after, subtitle, footer, children }) => (
      <div>
        {title && <div>{title}</div>}
        {subtitle && <div>{subtitle}</div>}
        {after && <div>{after}</div>}
        {footer && <div>{footer}</div>}
        {children}
      </div>
    ),
    PageContent: wrap('div'),
    Tab: ({ children, id, tabActive, className, onTabShow }) => {
      const { activeTab } = useTabState()
      const isActive = tabActive || activeTab === `#${id}`
      React.useEffect(() => {
        if (isActive) onTabShow?.()
      }, [isActive, onTabShow])
      return (
        <div id={id} className={`tab ${className || ''} ${isActive ? 'tab-active' : ''}`.trim()}>
          {isActive ? children : null}
        </div>
      )
    },
    Tabs: ({ children, ...props }) => <div {...cleanProps(props)}>{children}</div>,
    SwipeoutActions: wrap('div'),
    SwipeoutButton: ({ children, onClick, type = 'button', ...props }) => (
      <button type={type} onClick={onClick} {...cleanProps(props)}>
        {children}
      </button>
    ),
    Toolbar: wrap('div'),
  }
})

import Calculator from './Calculator'

describe('Calculator', () => {
  beforeEach(() => {
    localStorage.clear()
    if (globalThis.__f7MockTabStore) {
      globalThis.__f7MockTabStore.currentTab = '#tab-calc'
      globalThis.__f7MockTabStore.subscribers.clear()
    }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('shows calc/result tabs with accordion content', async () => {
    render(<Calculator />)

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    expect(screen.getByRole('button', { name: 'Calc' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Result' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Result' }))
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getAllByText('Total due').length).toBeGreaterThan(0)
  })

  it('restores saved room data from localStorage', async () => {
    localStorage.setItem(
      'pea-rental-calc',
      JSON.stringify({
        rooms: [20, 10],
        monthlyFee: 300,
        tax: 0.2,
        profit: 0.1,
        investment: 12000,
        minProfit: 75,
        sizeWeight: 1,
      })
    )

    render(<Calculator />)

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    expect(screen.getByText('20.00 m²')).toBeInTheDocument()
    expect(screen.getByText('10.00 m²')).toBeInTheDocument()
    expect(screen.getAllByText('30.00 m²').length).toBeGreaterThan(0)
  })

  it('shows validation feedback for invalid percentage input', async () => {
    render(<Calculator />)

    fireEvent.input(screen.getByLabelText('Tax'), { target: { value: '100' } })

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Result' }))
    expect(screen.getByText('Check your inputs')).toBeInTheDocument()
  })

  it('disables add-room button for invalid input and appends a new room for valid input', async () => {
    render(<Calculator />)

    const addRoomButton = screen.getByRole('button', { name: /add room/i })
    expect(addRoomButton).toBeDisabled()

    await act(async () => {
      fireEvent.input(screen.getByLabelText('New room area (m²)'), { target: { value: '22' } })
    })

    expect(addRoomButton).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(addRoomButton)
      vi.advanceTimersByTime(350)
      vi.runOnlyPendingTimers()
    })

    expect(addRoomButton).toBeDisabled()
    expect(screen.getByText('22.00 m²')).toBeInTheDocument()
  })
})
