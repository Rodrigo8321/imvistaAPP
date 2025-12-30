import React from 'react';
import { Text } from 'react-native';
import { usePortfolio } from '../../contexts/PortfolioContext';

const PrivacyAwareText = ({ children, style, ...props }) => {
  const { isPrivacyModeEnabled } = usePortfolio();

  if (isPrivacyModeEnabled) {
    // Mantém o estilo mas substitui o conteúdo por bolinhas ou asteriscos
    return <Text style={style} {...props}>••••••</Text>;
  }

  return <Text style={style} {...props}>{children}</Text>;
};

export default PrivacyAwareText;
