import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import colors from '../../styles/colors';

// Configuração de Locale para Português
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

const DividendCalendar = ({ dividends, onDayPress, selectedDate }) => {
  const markedDates = useMemo(() => {
    const marks = {};

    // Marca datas com dividendos
    dividends.forEach(div => {
      // Supõe formato YYYY-MM-DD. Se estiver DD/MM/YYYY, precisa converter
      // Aqui vamos assumir que recebemos objetos com data ISO ou formatada
      let dateKey = div.date;
      // Conversão simples se necessário (MOCK DATA usa DD/MM/YYYY, ajustaremos no Screen ou aqui)
      if (div.date.includes('/')) {
        const [day, month, year] = div.date.split('/');
        dateKey = `${year}-${month}-${day}`;
      }

      marks[dateKey] = {
        marked: true,
        dotColor: colors.success
      };
    });

    // Marca data selecionada
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: colors.surface
      };
    }

    return marks;
  }, [dividends, selectedDate]);

  return (
    <View style={styles.container}>
      <Calendar
        // Style
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: '#d9e1e8',
          dotColor: colors.success,
          selectedDotColor: '#ffffff',
          arrowColor: colors.primary,
          disabledArrowColor: '#d9e1e8',
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14
        }}
        // Handlers
        onDayPress={(day) => {
          onDayPress && onDayPress(day.dateString);
        }}
        // Marks
        markedDates={markedDates}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: colors.surface,
  }
});

export default DividendCalendar;
