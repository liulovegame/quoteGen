import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorPrimary: '#1677ff',
    borderRadius: 6,
    wireframe: true,
    colorTextDisabled: 'rgba(0,0,0,0.88)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    Card: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    },
    Table: {
      headerBg: '#fafafa',
    },
  },
};

export default theme; 