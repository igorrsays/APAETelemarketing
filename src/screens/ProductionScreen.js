import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { BackHandler} from 'react-native';

const ToggleButton = ({ mostrarTodos, setMostrarTodos }) => (
  <View style={toggleStyles.container}>
    <TouchableOpacity
      style={[toggleStyles.button, !mostrarTodos && toggleStyles.activeButton]}
      onPress={() => setMostrarTodos(false)}
    >
      <Text style={[toggleStyles.text, !mostrarTodos && toggleStyles.activeText]}>
        Dias Restantes
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[toggleStyles.button, mostrarTodos && toggleStyles.activeButton]}
      onPress={() => setMostrarTodos(true)}
    >
      <Text style={[toggleStyles.text, mostrarTodos && toggleStyles.activeText]}>
        Ver Todos
      </Text>
    </TouchableOpacity>
  </View>
);

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,

  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  text: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  activeText: {
    color: 'white',
  },
});

const Termometro = ({ mediaProducaoDiaria, metaDiaria }) => {
  const porcentagem = metaDiaria > 0 ? Math.min((mediaProducaoDiaria / metaDiaria) * 100, 100) : 0;
  const corBarra = porcentagem >= 100 ? '#32CD32' : '#FFA500';

  return (
    <View style={styles.termometroContainer}>
      <View style={[styles.termometroBar, { width: `${porcentagem}%`, backgroundColor: corBarra }]} />
      <Text style={styles.termometroText}>{`${porcentagem.toFixed(1)}%`}</Text>
    </View>
  );
};

export default function ProductionScreen() {
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [producao, setProducao] = useState({});
  const [metaDiaria, setMetaDiaria] = useState(0);
  const [mediaProducaoDiaria, setMediaProducaoDiaria] = useState(0);
  const [feriados, setFeriados] = useState([]);
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);
  const [metaMensal, setMetaMensal] = useState(0);
  const [producaoCadastro, setProducaoCadastro] = useState({});
  const [producaoLista, setProducaoLista] = useState({});
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailedProduction, setDetailedProduction] = useState({});
  const [newItemName, setNewItemName] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemType, setNewItemType] = useState('cadastro'); // 'cadastro' ou 'fichaNova'
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showAllDonations, setShowAllDonations] = useState(false);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const anos = Array.from({length: 10}, (_, i) => new Date().getFullYear() + i - 5);

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDiasUteisNoMes = useMemo(() => {
    const diasUteis = [];
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let dataInicial;
    if (!mostrarTodos && anoSelecionado === anoAtual && mesSelecionado === mesAtual) {
      dataInicial = new Date(anoAtual, mesAtual, diaAtual);
    } else {
      dataInicial = new Date(anoSelecionado, mesSelecionado, 1);
    }
    
    const ultimoDia = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
    
    for (let dia = dataInicial.getDate(); dia <= ultimoDia; dia++) {
      const data = new Date(anoSelecionado, mesSelecionado, dia);
      const dataString = data.toISOString().split('T')[0];
      if (
        data.getDay() !== 0 && 
        data.getDay() !== 6 &&
        !feriados.includes(dataString) &&
        !feriadosNacionais.includes(dataString)
      ) {
        diasUteis.push({
          dia: dia,
          diaSemana: diasSemana[data.getDay()]
        });
      }
    }
    
    return diasUteis;
  }, [anoSelecionado, mesSelecionado, feriados, feriadosNacionais, mostrarTodos]);

  const calcularDiasUteisRestantes = useCallback(() => {
    const hoje = new Date();
    return getDiasUteisNoMes.filter(({ dia }) => {
      const dataAtual = new Date(anoSelecionado, mesSelecionado, dia);
      // Incluir o dia atual na contagem
      return dataAtual >= hoje || 
             (dataAtual.getDate() === hoje.getDate() && 
              dataAtual.getMonth() === hoje.getMonth() && 
              dataAtual.getFullYear() === hoje.getFullYear());
    }).length;
  }, [anoSelecionado, mesSelecionado, getDiasUteisNoMes]);

  const atualizarMetaDiaria = useCallback((meta, producaoAtual) => {
    const diasUteisRestantes = calcularDiasUteisRestantes();
    const totalProduzido = Object.values(producaoAtual).reduce((sum, valor) => sum + (parseFloat(valor) || 0), 0) / 100;
    const metaRestante = Math.max(meta - totalProduzido, 0);
    
    console.log('Atualizando Meta Diária:');
    console.log('Meta Mensal:', meta);
    console.log('Dias Úteis Restantes:', diasUteisRestantes);
    console.log('Total Produzido:', totalProduzido);
    console.log('Meta Restante:', metaRestante);

    const novaMetaDiaria = diasUteisRestantes > 0 ? metaRestante / diasUteisRestantes : 0;
    console.log('Nova Meta Diária:', novaMetaDiaria);
    
    setMetaDiaria(novaMetaDiaria);
  }, [calcularDiasUteisRestantes]);

  const calcularMediaProducaoDiaria = useCallback((producaoAtual) => {
    const valores = Object.values(producaoAtual).map(valor => parseFloat(valor) || 0);
    const total = valores.reduce((sum, valor) => sum + valor, 0);
    const diasComProducao = valores.filter(valor => valor > 0).length;
    const media = diasComProducao > 0 ? total / diasComProducao / 100 : 0;
    console.log('Calculando Média de Produção Diária:');
    console.log('Total Produzido:', total / 100);
    console.log('Dias com Produção:', diasComProducao);
    console.log('Média Diária:', media);
    setMediaProducaoDiaria(media);
  }, []);

  const updateTotals = useCallback((dia, items) => {
    const cadastroTotal = items.reduce((sum, item) => sum + (parseFloat(item.cadastro) || 0), 0);
    const listaTotal = items.reduce((sum, item) => sum + (parseFloat(item.fichaNova) || 0), 0);

    const novaProducaoCadastro = { ...producaoCadastro, [dia]: (cadastroTotal * 100).toString() };
    const novaProducaoLista = { ...producaoLista, [dia]: (listaTotal * 100).toString() };

    setProducaoCadastro(novaProducaoCadastro);
    setProducaoLista(novaProducaoLista);

    // Atualizar meta diária e média de produção
    const producaoTotal = { ...novaProducaoCadastro, ...novaProducaoLista };
    atualizarMetaDiaria(metaMensal, producaoTotal);
    calcularMediaProducaoDiaria(producaoTotal);

    // Salvar os novos dados
    salvarProducao(novaProducaoCadastro, novaProducaoLista);
  }, [producaoCadastro, producaoLista, metaMensal, atualizarMetaDiaria, calcularMediaProducaoDiaria, salvarProducao]);

  const handleSaveItem = () => {
    if (!newItemName || !newItemValue) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    const novoItem = {
      nome: newItemName,
      cadastro: newItemType === 'cadastro' ? parseFloat(newItemValue) || 0 : 0,
      fichaNova: newItemType === 'fichaNova' ? parseFloat(newItemValue) || 0 : 0
    };

    let updatedItems;
    if (editingItem) {
      updatedItems = (detailedProduction[selectedDay] || []).map(item => 
        item === editingItem ? novoItem : item
      );
    } else {
      updatedItems = [...(detailedProduction[selectedDay] || []), novoItem];
    }

    const updatedDetailedProduction = {
      ...detailedProduction,
      [selectedDay]: updatedItems
    };

    setDetailedProduction(updatedDetailedProduction);
    salvarDadosDetalhados(updatedDetailedProduction);
    updateTotals(selectedDay, updatedItems);

    setNewItemName('');
    setNewItemValue('');
    setNewItemType('cadastro');
    setIsAddingNew(false);
    setEditingItem(null);
  };

  const deleteItem = useCallback((item) => {
    const updatedItems = detailedProduction[selectedDay].filter(i => i !== item);
    const updatedDetailedProduction = {
      ...detailedProduction,
      [selectedDay]: updatedItems
    };
    setDetailedProduction(updatedDetailedProduction);
    salvarDadosDetalhados(updatedDetailedProduction);
    updateTotals(selectedDay, updatedItems);
  }, [selectedDay, detailedProduction, updateTotals, salvarDadosDetalhados]);

  const confirmDeleteItem = useCallback((item) => {
    setItemToDelete(item);
    setIsDeleteConfirmationVisible(true);
  }, []);

  const handleDeleteConfirmed = useCallback(() => {
    if (itemToDelete) {
      deleteItem(itemToDelete);
      setIsDeleteConfirmationVisible(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteItem]);

  const carregarDados = useCallback(async () => {
    console.log('Carregando dados...');
    await carregarFeriados();
    await carregarFeriadosNacionais();
    await carregarProducao();
    await carregarDadosDetalhados();
    await carregarMeta();
  }, [mesSelecionado, anoSelecionado]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  useEffect(() => {
    const producaoTotal = combinarProducoes(producaoCadastro, producaoLista);
    atualizarMetaDiaria(metaMensal, producaoTotal);
    calcularMediaProducaoDiaria(producaoTotal);
  }, [metaMensal, producaoCadastro, producaoLista]);

  useEffect(() => {
    console.log('Meta Diária atualizada:', metaDiaria);
  }, [metaDiaria]);

  useEffect(() => {
    console.log('Média de Produção Diária atualizada:', mediaProducaoDiaria);
  }, [mediaProducaoDiaria]);

  useEffect(() => {

    carregarDadosDetalhados();
  }, []);

  const carregarDadosDetalhados = async () => {
    try {
      const chaveDadosDetalhados = `dadosDetalhados_${anoSelecionado}_${mesSelecionado}`;
      const dadosSalvos = await AsyncStorage.getItem(chaveDadosDetalhados);
      if (dadosSalvos) {
        setDetailedProduction(JSON.parse(dadosSalvos));
      }
    } catch (error) {
      console.error('Erro ao carregar dados detalhados:', error);
    }
  };

  const salvarDadosDetalhados = async (novosDados) => {
    try {
      const chaveDadosDetalhados = `dadosDetalhados_${anoSelecionado}_${mesSelecionado}`;
      await AsyncStorage.setItem(chaveDadosDetalhados, JSON.stringify(novosDados));
    } catch (error) {
      console.error('Erro ao salvar dados detalhados:', error);
    }
  };

  const carregarProducao = useCallback(async () => {
    try {
      const chaveCadastro = `producaoCadastro_${anoSelecionado}_${mesSelecionado}`;
      const chaveLista = `producaoLista_${anoSelecionado}_${mesSelecionado}`;
      const producaoCadastroSalva = await AsyncStorage.getItem(chaveCadastro);
      const producaoListaSalva = await AsyncStorage.getItem(chaveLista);
      
      const cadastro = producaoCadastroSalva ? JSON.parse(producaoCadastroSalva) : {};
      const lista = producaoListaSalva ? JSON.parse(producaoListaSalva) : {};
      
      setProducaoCadastro(cadastro);
      setProducaoLista(lista);
      
      const producaoTotal = combinarProducoes(cadastro, lista);
      setProducao(producaoTotal);

      console.log('Produção carregada:', producaoTotal);
      return producaoTotal;
    } catch (error) {
      console.error('Erro ao carregar produção:', error);
      return {};
    }
  }, [mesSelecionado, anoSelecionado]);

  const combinarProducoes = (cadastro, lista) => {
    const producaoTotal = { ...cadastro };
    Object.keys(lista).forEach(dia => {
      if (producaoTotal[dia]) {
        producaoTotal[dia] = (parseInt(producaoTotal[dia]) + parseInt(lista[dia])).toString();
      } else {
        producaoTotal[dia] = lista[dia];
      }
    });
    return producaoTotal;
  };

  const carregarMeta = useCallback(async () => {
    try {
      const chave = `meta_${anoSelecionado}_${mesSelecionado}`;
      const metaSalva = await AsyncStorage.getItem(chave);
      if (metaSalva !== null) {
        const metaValor = parseFloat(metaSalva);
        setMetaMensal(metaValor);
        return metaValor;
      } else {
        setMetaMensal(0);
        return 0;
      }
    } catch (error) {
      console.error('Erro ao carregar meta:', error);
      return 0;
    }
  }, [anoSelecionado, mesSelecionado]);

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

  const carregarFeriadosNacionais = async () => {
    try {
      const feriadosNacionaisSalvos = await AsyncStorage.getItem(`feriadosNacionais_${anoSelecionado}`);
      if (feriadosNacionaisSalvos) {
        setFeriadosNacionais(JSON.parse(feriadosNacionaisSalvos));
      }
    } catch (error) {
      console.error('Erro ao carregar feriados nacionais:', error);
    }
  };

  const salvarProducao = async (novaCadastro, novaLista) => {
    try {
      const chaveCadastro = `producaoCadastro_${anoSelecionado}_${mesSelecionado}`;
      const chaveLista = `producaoLista_${anoSelecionado}_${mesSelecionado}`;
      await AsyncStorage.setItem(chaveCadastro, JSON.stringify(novaCadastro));
      await AsyncStorage.setItem(chaveLista, JSON.stringify(novaLista));
      
      setProducaoCadastro(novaCadastro);
      setProducaoLista(novaLista);
      
      const novaProducaoTotal = combinarProducoes(novaCadastro, novaLista);
      setProducao(novaProducaoTotal);
      atualizarMetaDiaria(metaMensal, novaProducaoTotal);
      calcularMediaProducaoDiaria(novaProducaoTotal);

      console.log('Produção salva:', novaProducaoTotal);
    } catch (error) {
      console.error('Erro ao salvar produção:', error);
    }
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    const numero = parseFloat(valor) / 100;
    return `R$ ${numero.toFixed(2)}`;
  };

  const atualizarProducaoCadastro = (dia, valor) => {
    let valorNumerico = 0;
    if (valor !== '') {
      valorNumerico = parseInt(valor.replace(/[^\d]/g, '')) || 0;
    }
    const novaCadastro = { ...producaoCadastro, [dia]: valorNumerico.toString() };
    setProducaoCadastro(novaCadastro);
    salvarProducao(novaCadastro, producaoLista);
  };

  const atualizarProducaoLista = (dia, valor) => {
    let valorNumerico = 0;
    if (valor !== '') {
      valorNumerico = parseInt(valor.replace(/[^\d]/g, '')) || 0;
    }
    const novaLista = { ...producaoLista, [dia]: valorNumerico.toString() };
    setProducaoLista(novaLista);
    salvarProducao(producaoCadastro, novaLista);
  };

  const toggleMostrarTodos = () => {
    setMostrarTodos(prev => !prev);

  };

  const renderDiasUteis = () => {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const diasUteis = mostrarTodos 
      ? getDiasUteisNoMes 
      : getDiasUteisNoMes.filter(({ dia }) => {
          const dataAtual = new Date(anoSelecionado, mesSelecionado, dia);
          const dataHoje = new Date(anoAtual, mesAtual, diaAtual);
          
          // Inclui o dia atual na comparação
          return dataAtual >= dataHoje;
        });

    if (diasUteis.length === 0) {
      return <Text style={styles.mensagemSemDias}>Não há dias úteis restantes neste período.</Text>;
    }

    return diasUteis.map(({ dia, diaSemana }) => {
      const valorProducaoCadastro = parseFloat(producaoCadastro[dia] || 0) / 100;
      const valorProducaoLista = parseFloat(producaoLista[dia] || 0) / 100;
      const valorProducaoTotal = valorProducaoCadastro + valorProducaoLista;
      const atingiuMeta = valorProducaoTotal >= metaDiaria;

      const isToday = dia === diaAtual && mesSelecionado === mesAtual && anoSelecionado === anoAtual;

      return (
        <TouchableOpacity 
          key={dia} 
          style={[styles.diaContainer, isToday && styles.diaAtualContainer]} 
          onPress={() => handleDaySelect(dia)}
        >
          <Text style={[styles.diaTexto, isToday && styles.diaAtualTexto]}>
            {dia}, {diaSemana} {isToday ? '(Hoje)' : ''}
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.valorTexto}>{formatarValor(valorProducaoCadastro * 100)}</Text>
            <Text style={styles.valorTexto}>{formatarValor(valorProducaoLista * 100)}</Text>
            {valorProducaoTotal > 0 && (
              <Ionicons 
                name={atingiuMeta ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={atingiuMeta ? "#3CB371" : "#FF2400"} 
                style={styles.icon}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  const handleDaySelect = (dia) => {
    setSelectedDay(dia);
    setIsModalVisible(true);
   
    if (!detailedProduction[dia]) {
      const cadastroTotal = parseFloat(producaoCadastro[dia] || 0);
      const listaTotal = parseFloat(producaoLista[dia] || 0);
      if (cadastroTotal > 0 || listaTotal > 0) {
        setDetailedProduction(prev => ({
          ...prev,
          [dia]: [
            ...(cadastroTotal > 0 ? [{ nome: 'Total Cadastro', valor: cadastroTotal / 100, tipo: 'cadastro' }] : []),
            ...(listaTotal > 0 ? [{ nome: 'Total Ficha Nova', valor: listaTotal / 100, tipo: 'fichaNova' }] : [])
          ]
        }));
      }
    }
  };

  const renderModal = () => (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setIsModalVisible(false);
        setIsAddingNew(false);
        setEditingItem(null);
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Produção do dia {selectedDay}</Text>
          
          <FlatList
            data={[{ key: 'content' }]}
            renderItem={() => (
              <>
                {!isAddingNew && !editingItem && (
                  <FlatList
                    data={showAllDonations ? (detailedProduction[selectedDay] || []) : []}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        onPress={() => handleItemEdit(item)}
                        style={styles.itemContainer}
                      >
                        <Text style={styles.itemName}>{item.nome || ''}</Text>
                        <Text style={styles.itemValue}>
                          {formatarValor((item.cadastro || item.fichaNova || 0) * 100)}
                        </Text>
                        <Text style={styles.itemType}>
                          {item.cadastro > 0 ? 'Cadastro' : 'Ficha Nova'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item, index) => index.toString()}
                  />
                )}

                {editingItem && (
                  <TouchableOpacity 
                    onPress={() => setEditingItem(null)}
                    style={[styles.itemContainer, styles.selectedItem]}
                  >
                    <Text style={styles.itemName}>{editingItem.nome || ''}</Text>
                    <Text style={styles.itemValue}>
                      {formatarValor((editingItem.cadastro || editingItem.fichaNova || 0) * 100)}
                    </Text>
                    <Text style={styles.itemType}>
                      {editingItem.cadastro > 0 ? 'Cadastro' : 'Ficha Nova'}
                    </Text>
                  </TouchableOpacity>
                )}

                {renderItemForm()}
              </>
            )}
            style={styles.modalScrollView}
          />
          
          <View style={styles.fixedButtonsContainer}>
            {!isAddingNew && !editingItem && (
              <>
                <TouchableOpacity 
                  style={styles.toggleButton} 
                  onPress={() => setShowAllDonations(!showAllDonations)}
                >
                  <Text>{showAllDonations ? 'Esconder Todos' : 'Ver Todos'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={() => {
                    setIsAddingNew(true);
                    setEditingItem(null);
                    setNewItemName('');
                    setNewItemValue('');
                    setNewItemType('cadastro');
                  }}
                >
                  <Text>Adicionar Nova Doação</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                setIsModalVisible(false);
                setIsAddingNew(false);
                setEditingItem(null);
              }}
            >
              <Text>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderItemForm = () => (
    <View style={styles.formContainer}>
      {(isAddingNew || editingItem) && (
  <Text style={styles.formTitle}>
    {isAddingNew ? 'Nova Doação' : 'Editar Doação'}
  </Text>
)}
      {(isAddingNew || editingItem) && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={newItemName}
            onChangeText={setNewItemName}
          />
          <TextInput
            style={styles.input}
            placeholder="Valor"
            keyboardType="numeric"
            value={newItemValue}
            onChangeText={setNewItemValue}
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newItemType}
              style={styles.picker}
              onValueChange={(itemValue) => setNewItemType(itemValue)}
            >
              <Picker.Item label="Cadastro" value="cadastro" />
              <Picker.Item label="Ficha Nova" value="fichaNova" />
            </Picker>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSaveItem}>
            <Text>{isAddingNew ? 'Adicionar' : 'Atualizar'}</Text>
          </TouchableOpacity>
          {editingItem && (
            <TouchableOpacity style={styles.buttonDelete} onPress={() => confirmDeleteItem(editingItem)}>
              <Text>Excluir</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.buttonCancel} 
            onPress={() => {
              setIsAddingNew(false);
              setEditingItem(null);
              setNewItemName('');
              setNewItemValue('');
              setNewItemType('cadastro');
            }}
          >
            <Text>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const handleItemEdit = (item) => {
    if (editingItem === item) {
      setEditingItem(null);
      setIsAddingNew(false);
      setNewItemName('');
      setNewItemValue('');
      setNewItemType('cadastro');
    } else {
      setEditingItem(item);
      setIsAddingNew(false);
      setNewItemName(item.nome || '');
      setNewItemValue(item.cadastro ? item.cadastro.toString() : item.fichaNova.toString());
      setNewItemType(item.cadastro > 0 ? 'cadastro' : 'fichaNova');
    }
  };

  const renderDeleteConfirmationModal = () => (
    <Modal
      visible={isDeleteConfirmationVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsDeleteConfirmationVisible(false)}
    >
      <View style={styles.deleteModalContainer}>
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteModalTitle}>Confirmar Exclusão</Text>
          <Text style={styles.deleteModalText}>Tem certeza que deseja excluir este item?</Text>
          {itemToDelete && (
            <View style={styles.deleteItemSummary}>
              <Text style={styles.deleteItemText}>Nome: {itemToDelete.nome}</Text>
              <Text style={styles.deleteItemText}>Cadastro: {formatarValor(itemToDelete.cadastro * 100)}</Text>
              <Text style={styles.deleteItemText}>Ficha Nova: {formatarValor(itemToDelete.fichaNova * 100)}</Text>
            </View>
          )}
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity 
              style={[styles.deleteModalButton, styles.deleteModalCancelButton]} 
              onPress={() => setIsDeleteConfirmationVisible(false)}
            >
              <Text style={styles.deleteModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.deleteModalButton, styles.deleteModalConfirmButton]} 
              onPress={handleDeleteConfirmed}
            >
              <Text style={styles.deleteModalButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const atualizarPagina = () => {
    carregarDados();
  };

  const calcularProducaoTotal = () => {
    return Object.values(producaoCadastro).reduce((sum, valor) => sum + parseFloat(valor || 0), 0) +
           Object.values(producaoLista).reduce((sum, valor) => sum + parseFloat(valor || 0), 0);
  };

  const renderMetaInfo = () => {
    return (
      <View style={styles.metaDiariaContainer}>
        <Text style={styles.metaMensalText}>
          Meta Mensal: {formatarValor(metaMensal * 100)}
        </Text>
        <Text style={styles.metaDiariaText}>
          Meta Diária: {formatarValor(metaDiaria * 100)}
        </Text>
        <Text style={styles.mediaProducaoText}>
          Média de Produção Diária: {formatarValor(mediaProducaoDiaria * 100)}
        </Text>
        <Termometro mediaProducaoDiaria={mediaProducaoDiaria} metaDiaria={metaDiaria} />
      </View>
    );
  };

  const renderToggleButtons = () => (
    <ToggleButton mostrarTodos={mostrarTodos} setMostrarTodos={setMostrarTodos} />
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Produção Diária</Text>
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
              {anos.map((ano) => (
                <Picker.Item key={ano} label={ano.toString()} value={ano} />
              ))}
            </Picker>
          </View>
        </View>
        {renderMetaInfo()}
        {renderToggleButtons()}
        <View style={styles.diasContainer}>
          {renderDiasUteis()}
        </View>
      </ScrollView>
      {renderModal()}
      {renderDeleteConfirmationModal()}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  refreshButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  picker: {
    height: 50,
    width: '100%',
  },
  diasContainer: {
    flexDirection: 'column',
  },
  diaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  diaTexto: {
    fontWeight: 'bold',
    width: 80,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginHorizontal: 5,
  },
  icon: {
    marginLeft: 5,
  },
  metaDiariaContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  metaMensalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  metaDiariaText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  mediaProducaoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
    marginBottom: 5,
  },
  termometroContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  termometroBar: {
    height: '100%',
    borderRadius: 10,
  },
  termometroText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    lineHeight: 20,
  },
  mensagemSemDias: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white', // Mudado para branco
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  toggleSeparator: {
    width: 1,
    backgroundColor: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '85%',
    maxHeight: '80%',
    justifyContent: 'space-between', 
  },
  modalScrollView: {
    flexGrow: 1,
    marginBottom: 10, 
  },
  fixedButtonsContainer: {
    marginTop: 10,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  formContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonDelete: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    minHeight: 60,
    marginHorizontal: 5, 
    marginVertical: 5,    
    // sombra
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedItem: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
    borderWidth: 1,
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#52c41a',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonCancel: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  deleteItemSummary: {
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  deleteItemText: {
    fontSize: 14,
    marginBottom: 5,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  deleteModalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  deleteModalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  deleteModalConfirmButton: {
    backgroundColor: '#ff4d4f',
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  diaAtualContainer: {
    backgroundColor: '#e6f7ff', 
    borderColor: '#1890ff',
    borderWidth: 1,
  },
  diaAtualTexto: {
    fontWeight: 'bold',
    color: '#1890ff',
  },
  itemName: {
    flex: 1,
  },
  itemValue: {
    flex: 0,
    textAlign: 'center',
  },
  itemType: {
    flex: 1,
    textAlign: 'right',
  },
  selectedItem: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
    borderWidth: 1,
  },
  itemSeparator: {
    height: 10, 
  },
});