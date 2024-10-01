import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function HomeScreen() {
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [meta, setMeta] = useState(0);
  const [producaoTotal, setProducaoTotal] = useState(0);
  const [producaoDiaria, setProducaoDiaria] = useState({});
  const [diasUteisRestantes, setDiasUteisRestantes] = useState(0);
  const [feriados, setFeriados] = useState([]);
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);
  const [dadosAnuais, setDadosAnuais] = useState([]);
  const [producaoCadastro, setProducaoCadastro] = useState({});
  const [producaoLista, setProducaoLista] = useState({});
  const [mostrarUltimosTresMesesCadastro, setMostrarUltimosTresMesesCadastro] = useState(true);
  const [mostrarUltimosTresMesesFichaNova, setMostrarUltimosTresMesesFichaNova] = useState(true);
  const [dadosCadastro, setDadosCadastro] = useState([]);
  const [dadosFichaNova, setDadosFichaNova] = useState([]);

  const carregarTodosDados = useCallback(async () => {
    try {
      // Carregar meta
      const metaChave = `meta_${anoSelecionado}_${mesSelecionado}`;
      const metaSalva = await AsyncStorage.getItem(metaChave);
      setMeta(metaSalva ? parseFloat(metaSalva) : 0);

      // Carregar produção de cadastro e lista
      const chaveCadastro = `producaoCadastro_${anoSelecionado}_${mesSelecionado}`;
      const chaveLista = `producaoLista_${anoSelecionado}_${mesSelecionado}`;
      const producaoCadastroSalva = await AsyncStorage.getItem(chaveCadastro);
      const producaoListaSalva = await AsyncStorage.getItem(chaveLista);
      
      const cadastro = producaoCadastroSalva ? JSON.parse(producaoCadastroSalva) : {};
      const lista = producaoListaSalva ? JSON.parse(producaoListaSalva) : {};
      
      setProducaoCadastro(cadastro);
      setProducaoLista(lista);

      // Calcular produção total
      const totalCadastro = Object.values(cadastro).reduce((sum, value) => sum + parseInt(value || 0), 0);
      const totalLista = Object.values(lista).reduce((sum, value) => sum + parseInt(value || 0), 0);
      setProducaoTotal(totalCadastro + totalLista);

      // Carregar feriados
      const feriadosSalvos = await AsyncStorage.getItem('feriados');
      setFeriados(feriadosSalvos ? JSON.parse(feriadosSalvos) : []);

      // Carregar feriados nacionais 
      const feriadosNacionaisDoAno = await AsyncStorage.getItem(`feriadosNacionais_${anoSelecionado}`);
      setFeriadosNacionais(feriadosNacionaisDoAno ? JSON.parse(feriadosNacionaisDoAno) : []);

      // Calcular dias úteis restantes
      calcularDiasUteisRestantes();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, [mesSelecionado, anoSelecionado]);

  const carregarDadosAnuais = useCallback(async () => {
    const anoAtual = new Date().getFullYear();
    const dadosDoAno = [];

    for (let mes = 0; mes < 12; mes++) {
      const chaveCadastro = `producaoCadastro_${anoAtual}_${mes}`;
      const chaveLista = `producaoLista_${anoAtual}_${mes}`;
      const metaChave = `meta_${anoAtual}_${mes}`;

      try {
        const producaoCadastroSalva = await AsyncStorage.getItem(chaveCadastro);
        const producaoListaSalva = await AsyncStorage.getItem(chaveLista);
        const metaSalva = await AsyncStorage.getItem(metaChave);

        const cadastro = producaoCadastroSalva ? JSON.parse(producaoCadastroSalva) : {};
        const lista = producaoListaSalva ? JSON.parse(producaoListaSalva) : {};
        const meta = metaSalva ? parseFloat(metaSalva) : 0;

        const totalCadastro = Object.values(cadastro).reduce((sum, value) => sum + parseInt(value || 0), 0) / 100;
        const totalLista = Object.values(lista).reduce((sum, value) => sum + parseInt(value || 0), 0) / 100;
        const total = totalCadastro + totalLista;

        const porcentagem = meta > 0 ? (total / meta) * 100 : 0;
        dadosDoAno.push({ mes, ano: anoAtual, producao: total, meta, porcentagem });
      } catch (error) {
        console.error(`Erro ao carregar dados anuais para ${mes}/${anoAtual}:`, error);
        dadosDoAno.push({ mes, ano: anoAtual, producao: 0, meta: 0, porcentagem: 0 });
      }
    }

    setDadosAnuais(dadosDoAno);
  }, []);

  const carregarDadosDashboards = useCallback(async () => {
    const dadosCadastroTemp = [];
    const dadosFichaNovaTemp = [];

    for (let mes = 0; mes < 12; mes++) {
      const chaveCadastro = `producaoCadastro_${anoSelecionado}_${mes}`;
      const chaveLista = `producaoLista_${anoSelecionado}_${mes}`;
      const metaChave = `meta_${anoSelecionado}_${mes}`;

      try {
        const producaoCadastroSalva = await AsyncStorage.getItem(chaveCadastro);
        const producaoListaSalva = await AsyncStorage.getItem(chaveLista);
        const metaSalva = await AsyncStorage.getItem(metaChave);

        const cadastro = producaoCadastroSalva ? JSON.parse(producaoCadastroSalva) : {};
        const lista = producaoListaSalva ? JSON.parse(producaoListaSalva) : {};
        const metaTotal = metaSalva ? parseFloat(metaSalva) : 0;

        const totalCadastro = Object.values(cadastro).reduce((sum, value) => sum + parseInt(value || 0), 0) / 100;
        const totalLista = Object.values(lista).reduce((sum, value) => sum + parseInt(value || 0), 0) / 100;

        const metaCadastro = Math.max(metaTotal - 1000, 0);
        const metaFichaNova = 1000;

        const porcentagemCadastro = metaCadastro > 0 ? (totalCadastro / metaCadastro) * 100 : 0;
        const porcentagemLista = metaFichaNova > 0 ? (totalLista / metaFichaNova) * 100 : 0;

        dadosCadastroTemp.push({ 
          mes, 
          ano: anoSelecionado, 
          producao: totalCadastro, 
          meta: metaCadastro, 
          porcentagem: porcentagemCadastro 
        });
        dadosFichaNovaTemp.push({ 
          mes, 
          ano: anoSelecionado, 
          producao: totalLista, 
          meta: metaFichaNova, 
          porcentagem: porcentagemLista 
        });
      } catch (error) {
        console.error(`Erro ao carregar dados para ${mes}/${anoSelecionado}:`, error);
      }
    }

    setDadosCadastro(dadosCadastroTemp);
    setDadosFichaNova(dadosFichaNovaTemp);
  }, [anoSelecionado]);

  useFocusEffect(
    useCallback(() => {
      carregarTodosDados();
      carregarDadosAnuais();
      carregarDadosDashboards();
    }, [carregarTodosDados, carregarDadosAnuais, carregarDadosDashboards])
  );

  const calcularDiasUteisRestantes = useCallback(async () => {
    try {
      const feriadosSalvos = await AsyncStorage.getItem('feriados');
      const feriados = feriadosSalvos ? JSON.parse(feriadosSalvos) : [];
      
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      if (anoSelecionado < anoAtual || (anoSelecionado === anoAtual && mesSelecionado < mesAtual)) {
        setDiasUteisRestantes(0);
        return;
      }

      let dataInicial;
      if (anoSelecionado === anoAtual && mesSelecionado === mesAtual) {
        dataInicial = new Date(anoAtual, mesAtual, hoje.getDate());
      } else {
        dataInicial = new Date(anoSelecionado, mesSelecionado, 1);
      }

      const ultimoDiaDoMes = new Date(anoSelecionado, mesSelecionado + 1, 0);
      let diasUteis = 0;

      for (let d = dataInicial; d <= ultimoDiaDoMes; d.setDate(d.getDate() + 1)) {
        const dataString = d.toISOString().split('T')[0];
        if (d.getDay() !== 0 && d.getDay() !== 6 && !feriados.includes(dataString)) {
          diasUteis++;
        }
      }

      setDiasUteisRestantes(diasUteis);
    } catch (error) {
      console.error('Erro ao calcular dias úteis restantes:', error);
    }
  }, [anoSelecionado, mesSelecionado]);

  const formatarValor = (valor) => {
    return `R$ ${valor.toFixed(2)}`;
  };

  const calcularFaltante = () => {
    const producaoTotalEmReais = producaoTotal / 100;
    return Math.max(0, meta - producaoTotalEmReais);
  };

  const renderProducaoDiaria = () => {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const diasNoMes = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
    const diasParaMostrar = [];
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataAtual = new Date(anoSelecionado, mesSelecionado, dia);
      const valorCadastro = parseInt(producaoCadastro[dia] || 0);
      const valorLista = parseInt(producaoLista[dia] || 0);
      const valorTotal = valorCadastro + valorLista;
      
      if (
        (anoSelecionado < anoAtual) ||
        (anoSelecionado === anoAtual && mesSelecionado < mesAtual) ||
        (anoSelecionado === anoAtual && mesSelecionado === mesAtual && dia <= diaAtual) ||
        valorTotal > 0
      ) {
        diasParaMostrar.push({ dia, valor: valorTotal });
      }
    }
    
    return diasParaMostrar
      .sort((a, b) => a.dia - b.dia)
      .map(({ dia, valor }) => {
        const valorFormatado = formatarValor(valor / 100);
        return (
          <View key={dia} style={styles.producaoItem}>
            <Text>Dia {dia}:</Text>
            <Text>{valorFormatado}</Text>
          </View>
        );
      });
  };

  const togglePeriodoDashboardCadastro = () => {
    setMostrarUltimosTresMesesCadastro(!mostrarUltimosTresMesesCadastro);
  };

  const togglePeriodoDashboardFichaNova = () => {
    setMostrarUltimosTresMesesFichaNova(!mostrarUltimosTresMesesFichaNova);
  };

  const renderToggleButton = (mostrarUltimosTresMeses, toggleFunction) => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleButton, mostrarUltimosTresMeses && styles.toggleButtonActive]}
        onPress={() => toggleFunction(true)}
      >
        <Text style={[styles.toggleButtonText, mostrarUltimosTresMeses && styles.toggleButtonTextActive]}>
          Últimos 3 meses
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, !mostrarUltimosTresMeses && styles.toggleButtonActive]}
        onPress={() => toggleFunction(false)}
      >
        <Text style={[styles.toggleButtonText, !mostrarUltimosTresMeses && styles.toggleButtonTextActive]}>
          Anual
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDashboard = (titulo, dados, mostrarToggle = false, mostrarUltimosTresMeses = true, toggleFunction = null) => {
    let dadosFiltrados = dados;
    if (mostrarToggle && mostrarUltimosTresMeses) {
      const indexMesSelecionado = dados.findIndex(d => d.mes === mesSelecionado);
      if (indexMesSelecionado !== -1) {
        const startIndex = Math.max(0, indexMesSelecionado - 2);
        dadosFiltrados = dados.slice(startIndex, indexMesSelecionado + 1);
      }
    }

    const labels = dadosFiltrados.map(d => meses[d.mes].substring(0, 3));

    const dadosGrafico = {
      labels,
      datasets: [
        {
          data: dadosFiltrados.map(d => parseFloat((Math.min(d.porcentagem || 0, 100)).toFixed(2))),
        },
      ],
    };

    return (
      <View style={styles.dashboardWrapper}>
        <View style={styles.dashboardHeader}>
          <Text style={styles.subtitle}>{titulo}</Text>
          {mostrarToggle && renderToggleButton(mostrarUltimosTresMeses, toggleFunction)}
        </View>
        <View style={styles.dashboardContainer}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <BarChart
              data={dadosGrafico}
              width={Dimensions.get('window').width * (dadosFiltrados.length <= 3 ? 1 : 1.5)}
              height={220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#e5f1ff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(60, 179, 113, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.7,
                propsForVerticalLabels: {
                  fontSize: 10,
                },
                formatTopValue: (value) => `${value.toFixed(2)}%`,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              showValuesOnTopOfBars={true}
              fromZero={true}
              segments={5}
            />
          </ScrollView>
          <View style={styles.legendaContainer}>
            {dadosFiltrados.map((dado, index) => (
              <View key={index} style={styles.legendaItem}>
                <Text style={styles.legendaMes}>{meses[dado.mes]}:</Text>
                <Text style={styles.legendaValor}>
                  {formatarValor(dado.producao)} / {formatarValor(dado.meta)}
                </Text>
                <Text style={[
                  styles.legendaPorcentagem,
                  { color: dado.porcentagem >= 100 ? 'green' : 'red' }
                ]}>
                  {dado.porcentagem.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resumo Mensal</Text>
      <View style={styles.seletoresContainer}>
        <View style={styles.seletorContainer}>
          <Picker
            selectedValue={mesSelecionado}
            style={styles.picker}
            onValueChange={(itemValue) => setMesSelecionado(itemValue)}
          >
            {meses.map((mes, index) => (
              <Picker.Item key={index} label={mes} value={index} />
            ))}
          </Picker>
        </View>
        <View style={styles.seletorContainer}>
          <Picker
            selectedValue={anoSelecionado}
            style={styles.picker}
            onValueChange={(itemValue) => setAnoSelecionado(itemValue)}
          >
            {[...Array(5)].map((_, i) => {
              const ano = new Date().getFullYear() - 2 + i;
              return <Picker.Item key={ano} label={ano.toString()} value={ano} />;
            })}
          </Picker>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{formatarValor(meta)}</Text>
            <Text style={styles.infoLabel}>Meta</Text>
          </View>
          <View style={styles.verticalSeparator} />
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{formatarValor(producaoTotal / 100)}</Text>
            <Text style={styles.infoLabel}>Produzido</Text>
          </View>
          <View style={styles.verticalSeparator} />
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{formatarValor(calcularFaltante())}</Text>
            <Text style={styles.infoLabel}>Faltam</Text>
          </View>
        </View>
        <View style={styles.separator} />
        <Text style={styles.diasRestantes}>
          {diasUteisRestantes > 0
            ? `Dias Restantes: ${diasUteisRestantes} ${diasUteisRestantes === 1 ? '' : ''}`
            : 'Encerrado'}
        </Text>
      </View>
      <Text style={styles.subtitle}>Produção Diária</Text>
      <View style={styles.producaoContainer}>
        {renderProducaoDiaria()}
      </View>
      {renderDashboard('Dashboard Anual', dadosAnuais)}
      {renderDashboard('Cadastro', dadosCadastro, true, mostrarUltimosTresMesesCadastro, setMostrarUltimosTresMesesCadastro)}
      {renderDashboard('Ficha Nova', dadosFichaNova, true, mostrarUltimosTresMesesFichaNova, setMostrarUltimosTresMesesFichaNova)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#228B22',
  },
  infoLabel: {
    fontSize: 14,
  },
  verticalSeparator: {
    width: 1,
    height: '100%',
    backgroundColor: '#ddd',
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 15,
  },
  diasRestantes: {
    textAlign: 'center',
    fontSize: 16,
  },
  producaoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  producaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dashboardContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,

  },
  legendaContainer: {
    marginTop: 15,
  },
  legendaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendaMes: {
    width: '20%',
    fontSize: 12,
    fontWeight: 'bold',
  },
  legendaValor: {
    width: '50%',
    fontSize: 12,
  },
  legendaPorcentagem: {
    width: '30%',
    fontSize: 12,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0F0F0',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  dashboardWrapper: {
    marginBottom: 20,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seletoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  seletorContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
});