import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function GoalScreen() {
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [meta, setMeta] = useState('');
  const [feriados, setFeriados] = useState([]);
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const anos = Array.from({length: 10}, (_, i) => new Date().getFullYear() + i - 5);

  const carregarDados = useCallback(async () => {
    await carregarMetaExistente();
    await carregarFeriados();
    await carregarFeriadosNacionais();
  }, [mesSelecionado, anoSelecionado]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const formatarParaReais = (valor) => {
    if (!valor) return '';
    if (typeof valor === 'string' && valor.includes('R$')) {
      return valor;
    }
    const numero = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
    return `R$ ${numero.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  const carregarMetaExistente = async () => {
    try {
      const chave = `meta_${anoSelecionado}_${mesSelecionado}`;
      const metaSalva = await AsyncStorage.getItem(chave);
      if (metaSalva) {
        setMeta(formatarParaReais(metaSalva));
      } else {
        setMeta('');
      }
    } catch (error) {
      console.error('Erro ao carregar meta existente:', error);
    }
  };

  const carregarFeriados = async () => {
    try {
      const feriadosSalvos = await AsyncStorage.getItem('feriados');
      if (feriadosSalvos) {
        setFeriados(JSON.parse(feriadosSalvos));
      } else {
        setFeriados([]);
      }
    } catch (error) {
      console.error('Erro ao carregar feriados:', error);
    }
  };

  const carregarFeriadosNacionais = async () => {
    try {
      const feriadosNacionaisSalvos = await AsyncStorage.getItem(`feriadosNacionais_${anoSelecionado}`);
      if (feriadosNacionaisSalvos) {
        setFeriadosNacionais(JSON.parse(feriadosNacionaisSalvos));
      } else {
        setFeriadosNacionais([]);
      }
    } catch (error) {
      console.error('Erro ao carregar feriados nacionais:', error);
    }
  };

  const calcularDiasUteis = (mes, ano) => {
    let diasUteis = 0;
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(ano, mes, dia);
      const dataString = data.toISOString().split('T')[0];
      if (
        data.getDay() !== 0 && 
        data.getDay() !== 6 && 
        !feriados.includes(dataString) &&
        !feriadosNacionais.includes(dataString)
      ) {
        diasUteis++;
      }
    }
    
    return diasUteis;
  };

  const definirMeta = () => {
    const metaValor = parseFloat(meta.replace('R$ ', '').replace('.', '').replace(',', '.'));
    if (isNaN(metaValor) || metaValor <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido para a meta.');
      return;
    }

    const diasUteis = calcularDiasUteis(mesSelecionado, anoSelecionado);
    const metaDiaria = metaValor / diasUteis;

    const chave = `meta_${anoSelecionado}_${mesSelecionado}`;
    AsyncStorage.setItem(chave, metaValor.toString())
      .then(() => {
        Alert.alert(
          'Meta Definida',
          `Sua meta para ${meses[mesSelecionado]} de ${anoSelecionado} é ${formatarParaReais(metaValor)}.\n` +
          `Dias úteis: ${diasUteis}\n` +
          `Meta diária: ${formatarParaReais(metaDiaria)}`
        );
      })
      .catch(error => {
        console.error('Erro ao salvar meta:', error);
        Alert.alert('Erro', 'Não foi possível salvar a meta. Tente novamente.');
      });
  };

  const handleMetaChange = (texto) => {
    const numeroLimpo = texto.replace(/[^\d]/g, '');
    const valorNumerico = parseFloat(numeroLimpo) / 100;
    setMeta(formatarParaReais(valorNumerico));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Picker
          selectedValue={mesSelecionado}
          style={styles.monthPicker}
          onValueChange={(itemValue) => setMesSelecionado(itemValue)}
        >
          {meses.map((mes, index) => (
            <Picker.Item key={index} label={mes} value={index} />
          ))}
        </Picker>
        <Picker
          selectedValue={anoSelecionado}
          style={styles.yearPicker}
          onValueChange={(itemValue) => setAnoSelecionado(itemValue)}
        >
          {anos.map((ano) => (
            <Picker.Item key={ano} label={ano.toString()} value={ano} />
          ))}
        </Picker>
      </View>
      <Text style={styles.title}>Definir Meta Mensal</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="R$ 0,00"
        value={meta}
        onChangeText={handleMetaChange}
      />
      <Button title="Definir Meta" onPress={definirMeta} color="#3CB371"/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthPicker: {
    flex: 1,
    height: 50,
  },
  yearPicker: {
    flex: 1,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});
