import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TouchableWithoutFeedback } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocaleConfig } from 'react-native-calendars';


LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
    'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};

LocaleConfig.defaultLocale = 'pt-br';

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [feriados, setFeriados] = useState([]);
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);

  useEffect(() => {
    carregarFeriados();
    const anoAtual = new Date().getFullYear();
    gerarFeriadosNacionais(anoAtual);
    gerarFeriadosNacionais(anoAtual + 1);
  }, []);

  useEffect(() => {
    atualizarCalendario();
  }, [feriados, feriadosNacionais, selectedDate]);

  const carregarFeriados = async () => {
    try {
      const feriadosSalvos = await AsyncStorage.getItem('feriados');
      if (feriadosSalvos) {
        setFeriados(JSON.parse(feriadosSalvos));
      }
    } catch (error) {
      console.error('Erro ao carregar feriados:', error);
    }
  };

  const salvarFeriados = async (novosFeriados) => {
    try {
      await AsyncStorage.setItem('feriados', JSON.stringify(novosFeriados));
      setFeriados(novosFeriados);
    } catch (error) {
      console.error('Erro ao salvar feriados:', error);
    }
  };

  const gerarFeriadosNacionais = (ano) => {
    const pascoa = calcularPascoa(ano);
    const feriadosFixos = [
      `${ano}-01-01`, // Ano Novo
      `${ano}-04-21`, // Tiradentes
      `${ano}-05-01`, // Dia do Trabalho
      `${ano}-09-07`, // Independência do Brasil
      `${ano}-10-12`, // Nossa Senhora Aparecida
      `${ano}-11-02`, // Finados
      `${ano}-11-15`, // Proclamação da República
      `${ano}-12-25`, // Natal
    ];

    const feriadosMoveis = [
      adicionarDias(pascoa, -47), // Carnaval
      adicionarDias(pascoa, -2),  // Sexta-feira Santa
      pascoa,                     // Páscoa
      adicionarDias(pascoa, 60),  // Corpus Christi
    ];

    setFeriadosNacionais(prevFeriados => [...prevFeriados, ...feriadosFixos, ...feriadosMoveis]);
  };

  const calcularPascoa = (ano) => {
    const C = Math.floor(ano / 100);
    const N = ano - 19 * Math.floor(ano / 19);
    const K = Math.floor((C - 17) / 25);
    let I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
    I = I - 30 * Math.floor(I / 30);
    I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
    let J = ano + Math.floor(ano / 4) + I + 2 - C + Math.floor(C / 4);
    J = J - 7 * Math.floor(J / 7);
    const L = I - J;
    const mes = 3 + Math.floor((L + 40) / 44);
    const dia = L + 28 - 31 * Math.floor(mes / 4);
    return `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
  };

  const adicionarDias = (data, dias) => {
    const resultado = new Date(data);
    resultado.setDate(resultado.getDate() + dias);
    return resultado.toISOString().split('T')[0];
  };

  const atualizarCalendario = () => {
    const anoAtual = new Date().getFullYear();
    const novoMarkedDates = {};

    for (let ano = anoAtual; ano <= anoAtual + 1; ano++) {
      for (let mes = 0; mes < 12; mes++) {
        const ultimoDia = new Date(ano, mes + 1, 0).getDate();
        
        for (let dia = 1; dia <= ultimoDia; dia++) {
          const data = new Date(ano, mes, dia);
          const dataString = data.toISOString().split('T')[0];
          
          if (data.getDay() === 0 || data.getDay() === 6) {
            novoMarkedDates[dataString] = { disabled: true, disableTouchEvent: true, color: 'lightgray' };
          } else if (feriados.includes(dataString) || feriadosNacionais.includes(dataString)) {
            novoMarkedDates[dataString] = { selected: true, selectedColor: '#FF2400' };
          } else {
            novoMarkedDates[dataString] = { selected: true, selectedColor: '#3CB371' };
          }

          
          if (dataString === selectedDate) {
            novoMarkedDates[dataString] = {
              ...novoMarkedDates[dataString],
              selected: true,
              selectedColor: 'rgba(128, 128, 128, 0.5)', // Cinza semi-transparente
              customStyles: {
                container: {
                  transform: [{ scale: 0.9 }],
                },
              },
            };
          }
        }
      }
    }

    setMarkedDates(novoMarkedDates);
  };

  const handleDayPress = (day) => {
    if (day.dateString === selectedDate) {
      setSelectedDate('');
    } else {
      setSelectedDate(day.dateString);
    }
  };

  const adicionarRemoverFeriado = async () => {
    if (!selectedDate) return;

    const novosFeriados = [...feriados];
    const index = novosFeriados.indexOf(selectedDate);

    if (index > -1) {
      novosFeriados.splice(index, 1);
      Alert.alert('Sucesso', 'Feriado removido com sucesso.');
    } else {
      novosFeriados.push(selectedDate);
      Alert.alert('Sucesso', 'Feriado adicionado com sucesso.');
    }

    await salvarFeriados(novosFeriados);
    setFeriados(novosFeriados);
    setSelectedDate(''); 
  };

  const handleOutsidePress = () => {
    setSelectedDate(''); 
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          hideExtraDays={true}
          markingType={'custom'}
          theme={{
            todayTextColor: '#00adf5',
            selectedDayBackgroundColor: '#00adf5',
            selectedDayTextColor: '#ffffff',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
          }}
        />
        {selectedDate && (
          <TouchableOpacity style={styles.button} onPress={adicionarRemoverFeriado}>
            <Text style={styles.buttonText}>
              {feriados.includes(selectedDate) ? 'Remover Feriado' : 'Adicionar Feriado'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
