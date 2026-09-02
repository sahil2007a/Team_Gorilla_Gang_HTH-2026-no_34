export const mockTasks = [
  {
    id: 't1',
    title: 'Irrigation',
    description: 'Soil moisture is below optimum. Irrigation recommended.',
    priority: 'high',
    category: 'irrigation',
    dueDate: '2026-08-15',
    status: 'pending',
    actionLabel: 'View Recommendation',
    actionRoute: '/irrigation',
  },
  {
    id: 't2',
    title: 'Fertilizer Application',
    description: 'Next application due in 2 days. NPK 20:20:20.',
    priority: 'medium',
    category: 'fertilizer',
    dueDate: '2026-08-17',
    status: 'pending',
    actionLabel: 'View Schedule',
    actionRoute: '/crop-lifecycle',
  },
  {
    id: 't3',
    title: 'Field Inspection',
    description: 'Weekly field inspection due today. Check for pests.',
    priority: 'medium',
    category: 'inspection',
    dueDate: '2026-08-15',
    status: 'pending',
    actionLabel: 'Mark Complete',
    actionRoute: null,
  },
  {
    id: 't4',
    title: 'Pesticide Spray',
    description: 'Preventive spray completed successfully.',
    priority: 'low',
    category: 'pesticide',
    dueDate: '2026-08-12',
    status: 'completed',
    actionLabel: 'View Report',
    actionRoute: null,
  },
];

export const mockDiaryEntries = [
  {
    id: 'd1',
    date: '2026-08-15',
    dayLabel: 'Today',
    isToday: true,
    entries: [
      { 
        id: 'e1', 
        tag: 'Irrigation', 
        tagColor: 'green', 
        time: '08:00 AM', 
        text: 'Completed scheduled watering cycle for Sector 1 & 2. Soil moisture optimal.' 
      },
    ],
  },
  {
    id: 'd2',
    date: '2026-08-14',
    dayLabel: 'Yesterday',
    entries: [
      { 
        id: 'e2', 
        tag: 'Fertilizer', 
        tagColor: 'pink', 
        time: '14:30 PM', 
        text: 'Applied NPK mix to greenhouse crops. Weather clear.' 
      },
    ],
  },
  {
    id: 'd3',
    date: '2026-08-10',
    dayLabel: 'Aug 10',
    entries: [
      { 
        id: 'e3', 
        tag: 'Disease Log', 
        tagColor: 'red', 
        time: '10:15 AM', 
        text: 'Logged suspected fungal issue in corner of Sector 4. AI analysis initiated.' 
      },
    ],
  },
];
