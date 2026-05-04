import React from 'react';
import {
  Stack,
  Box,
  Grid,
  Card,
  Typography,
  Chip,
  useTheme,
  Divider,
} from '@mui/material';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { BarChart as BarIcon, Assessment, Timeline } from '@mui/icons-material';

const COLORS = ['#4CAF50', '#FFC107', '#F44336'];

const Graph = ({ requestCount, active, cancelled, revenueList }) => {
  const theme = useTheme();

  // ✅ Dynamic Data (INSIDE COMPONENT)
  const barData = [
    {
      name: 'Bookings',
      Requests: requestCount || 0,
      Active: active || 0,
      Cancelled: cancelled || 0,
    },
  ];

  const pieData = [
    { name: 'Active', value: active || 0 },
    { name: 'Cancelled', value: cancelled || 0 },
    { name: 'Requests', value: requestCount || 0 },
  ];

  const lineData =
    revenueList?.map((item) => ({
      name: item.date || item.month || 'N/A',
      value: item.amount || item.total || 0,
    })) || [];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f8f9fa' }}>
      <Typography variant="h5" fontWeight={700} mb={4}>
        📊 Booking Dashboard Analytics
      </Typography>

      <Grid container rowSpacing={4} columnSpacing={3}>

        {/* 🔵 BAR CHART */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, borderRadius: 4, boxShadow: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <BarIcon color="primary" />
              <Typography variant="h6">Booking Overview</Typography>
            </Stack>

            <Box height={300}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Requests" fill="#1976d2" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Active" fill="#2e7d32" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Cancelled" fill="#d32f2f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* 🟡 PIE CHART */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, borderRadius: 4, boxShadow: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Assessment color="primary" />
              <Typography variant="h6">Booking Status</Typography>
            </Stack>

            <Box height={250}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* 🟣 LINE CHART */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3, borderRadius: 4, boxShadow: 6 }}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Stack direction="row" spacing={1}>
                <Timeline color="primary" />
                <Typography variant="h6">Revenue Trend</Typography>
              </Stack>
              <Chip label="Dynamic" color="primary" />
            </Stack>

            <Box height={300}>
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Graph;