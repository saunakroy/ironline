import type { AgentName } from './types'

export interface AgentMessage {
  id: string
  from: AgentName
  to: AgentName | 'All' | string
  message: string
  loadId?: string
  time: string
}

export const agentMessages: AgentMessage[] = [
  {
    id: 'm1',
    from: 'Watchdog',
    to: 'Billing Agent',
    message: 'Rate con on P3 shows $1,680 but invoice billed $1,380. Can you confirm which quote version was used?',
    loadId: 'P3',
    time: '11:42 PM',
  },
  {
    id: 'm2',
    from: 'Billing Agent',
    to: 'Watchdog',
    message: 'Confirmed — invoice used the superseded quote. Flagging a $300 shortfall for the briefing.',
    loadId: 'P3',
    time: '11:42 PM',
  },
  {
    id: 'm3',
    from: 'Fuel Agent',
    to: 'All',
    message: 'Card ending 7741 swiped in Kansas City at 09:05, then Amarillo at 12:08. 480 miles in 3h03m is not physically possible.',
    loadId: 'P7',
    time: '11:47 PM',
  },
  {
    id: 'm4',
    from: 'Watchdog',
    to: 'Fuel Agent',
    message: 'Checked ELD logs for P7 — truck never left Kansas City yard until 10:30 PM. Escalating as likely card fraud.',
    loadId: 'P7',
    time: '11:48 PM',
  },
  {
    id: 'm5',
    from: 'Detention Agent',
    to: 'Billing Agent',
    message: 'P1 dock log shows 4h30m on site, 2h free. 2h30m billable at $65/hr was never added to the invoice.',
    loadId: 'P1',
    time: '11:51 PM',
  },
  {
    id: 'm6',
    from: 'Billing Agent',
    to: 'Detention Agent',
    message: 'Got it, queuing a detention line item for tonight’s briefing.',
    loadId: 'P1',
    time: '11:51 PM',
  },
]
