import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const Dashboard = () => {
  const metaMensal = 1000;
  const producaoAtual = 750;
  const diasRestantes = 10;

  const progresso = (producaoAtual / metaMensal) * 100;

  const dadosGrafico = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        data: [500, 600, 750, 800, 750, producaoAtual],
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Meta Mensal: R$ {metaMensal}</Text>
      <Text>Produção Atual: R$ {producaoAtual}</Text>
      <Text>Progresso: {progresso.toFixed(2)}%</Text>
      <Text>Dias Restantes: {diasRestantes}</Text>
      
      <LineChart
        data={dadosGrafico}
        width={Dimensions.get('window').width - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#e26a00',
          backgroundGradientFrom: '#fb8c00',
          backgroundGradientTo: '#ffa726',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default Dashboard;
