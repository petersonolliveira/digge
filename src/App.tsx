import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, ArrowLeft, Phone, Mail, User, DollarSign, TrendingUp, Scale, MessageCircle, CheckCircle, Target, Zap, Trophy, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addUTMsToLinks, getUTMParams } from './utmHandler';

function Footer() {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center justify-center mb-12">
      <img 
        src="https://digge.com.br/wp-content/uploads/2024/11/Logo.png" 
        alt="Digge Logo" 
        className="h-6 mb-6"
      />
      <p className="text-gray-500 text-sm">CNPJ: 49.139.333/0001-95</p>
    </div>
  );
}

interface QuizData {
  area: string;
  investimento: number;
  ticket: number;
  taxa_conversao: number;
  faturamento_atual: number;
  nome: string;
  whatsapp: string;
  email: string;
}

interface AppProps {
  initialStep?: number;
}

const AREA_CPL_MAP: Record<string, number> = {
  'PREVIDENCIÁRIO': 22.06,
  'BANCÁRIO/CONSUMIDOR': 33.12,
  'TRABALHISTA': 25,
  'FAMÍLIA': 57.94,
  'CRIMINAL': 87.35,
  'TRIBUTÁRIO': 56.71,
  'EMPRESARIAL': 64.76,
  'OUTROS': 22.06,
};

const FATURAMENTO_MAP: Record<string, number> = {
  'Até 10 mil': 10000,
  'De 11 mil à 30 mil': 20000,
  'De 31 mil à 50 mil': 40000,
  'De 51 mil à 70 mil': 60000,
  'De 71 mil à 100 mil': 85000,
  'Acima de 100 mil': 120000,
};

const TAXA_CONVERSAO_MAP: Record<string, number> = {
  'Excelente': 0.35,
  'Boa': 0.24,
  'Ruim': 0.12,
};

function App({ initialStep = 0 }: AppProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [investimentoDisplay, setInvestimentoDisplay] = useState('');
  const [ticketDisplay, setTicketDisplay] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [quizData, setQuizData] = useState<QuizData>({
    area: '',
    investimento: 0,
    ticket: 0,
    taxa_conversao: 0,
    faturamento_atual: 0,
    nome: '',
    whatsapp: '',
    email: '',
  });
  const navigate = useNavigate();

  // Adiciona o script UTM quando o componente montar
  useEffect(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addUTMsToLinks);
    } else {
      addUTMsToLinks();
    }
  }, []);

  const calculateResults = () => {
    const cpl = AREA_CPL_MAP[quizData.area] || 25;
    const leadsPosse = quizData.investimento / cpl;
    const contratosPosse = leadsPosse * quizData.taxa_conversao;
    const faturamentoPotencial = contratosPosse * quizData.ticket;
    
    // Garantir que sempre mostre um valor positivo
    let valorDeixadoNaMesa;
    if (faturamentoPotencial > quizData.faturamento_atual) {
      valorDeixadoNaMesa = faturamentoPotencial - quizData.faturamento_atual;
    } else {
      // Se o potencial for menor que o atual, mostrar pelo menos 20% do faturamento atual
      // como oportunidade de otimização
      valorDeixadoNaMesa = Math.max(quizData.faturamento_atual * 0.2, faturamentoPotencial * 0.3);
    }
    
    return {
      cpl,
      leadsPosse: Math.round(leadsPosse),
      contratosPosse: Math.round(contratosPosse),
      faturamentoPotencial: Math.round(faturamentoPotencial),
      valorDeixadoNaMesa: Math.round(valorDeixadoNaMesa),
    };
  };

  const sendWebhook = async () => {
    try {
      const utmParams = getUTMParams();
      const payload = {
        ...quizData,
        ...utmParams,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('https://hook.us1.make.com/sf31vpldv8wqle5k25w2aupr2gqx2rqt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar dados');
      }

      console.log('Dados enviados com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e formata
    const numberValue = parseInt(numbers);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numberValue);
  };

  const parseCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers ? parseInt(numbers) : 0;
  };

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const validateWhatsApp = (number: string) => {
    const numbers = number.replace(/\D/g, '');
    if (numbers.length !== 11) {
      setWhatsappError('Insira um número válido com DDD (11 dígitos)');
      return false;
    }
    setWhatsappError('');
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Por favor, insira um email válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const startLoading = () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentStep(6); // Move para tela de loading
    
    // Simular progresso de carregamento
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            setCurrentStep(7); // Vai para tela de dados após loading
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Incremento aleatório entre 5-20%
      });
    }, 150);
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Olá, quero agendar uma conversa sobre o meu escritório');
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  // Tela 0 - Inicial
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <Scale className="w-16 h-16 text-[#ffd200] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              TESTE DE ESCALA PARA ADVOGADOS
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Descubra o quanto de dinheiro seu escritório está deixando na mesa todos os meses.
            </p>
          </div>
          
          <button
            onClick={nextStep}
            className="bg-[#ffd200] text-[#191919] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#ffdc33] transition-colors flex items-center gap-2 mx-auto"
          >
            Começar Diagnóstico
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela 1 - Área de Atuação
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Qual sua área de atuação?
            </h2>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div className="bg-[#ffd200] h-2 rounded-full" style={{ width: '16.66%' }}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(AREA_CPL_MAP).map((area) => (
              <button
                key={area}
                onClick={() => {
                  setQuizData({ ...quizData, area });
                  nextStep();
                }}
                className="bg-gray-800 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-left border border-gray-700 hover:border-[#ffd200]"
              >
                {area}
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={prevStep}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela 2 - Investimento em Tráfego
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Quanto você investe por mês em tráfego pago?
            </h2>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div className="bg-[#ffd200] h-2 rounded-full" style={{ width: '33.33%' }}></div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="mb-4">
              <DollarSign className="w-6 h-6 text-[#ffd200] mb-2" />
              <p className="text-gray-300 text-sm mb-3">Inclua Google Ads, Facebook Ads, Instagram Ads e outras plataformas</p>
              <input
                type="text"
                placeholder="Ex: R$ 3.000"
                value={investimentoDisplay}
                onChange={(e) => {
                  const formatted = formatCurrencyInput(e.target.value);
                  setInvestimentoDisplay(formatted);
                  setQuizData({ ...quizData, investimento: parseCurrencyInput(e.target.value) });
                }}
                className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#ffd200] focus:outline-none text-lg"
              />
            </div>
            
            <button
              onClick={nextStep}
              disabled={!quizData.investimento}
              className="w-full bg-[#ffd200] text-[#191919] p-4 rounded-lg font-bold text-lg hover:bg-[#ffdc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={prevStep}
              className="w-full mt-4 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela 3 - Ticket Médio
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Qual o ticket médio dos seus contratos?
            </h2>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div className="bg-[#ffd200] h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="mb-4">
              <TrendingUp className="w-6 h-6 text-[#ffd200] mb-2" />
              <p className="text-gray-300 text-sm mb-3">Valor médio que você cobra por contrato fechado</p>
              <input
                type="text"
                placeholder="Ex: R$ 4.500"
                value={ticketDisplay}
                onChange={(e) => {
                  const formatted = formatCurrencyInput(e.target.value);
                  setTicketDisplay(formatted);
                  setQuizData({ ...quizData, ticket: parseCurrencyInput(e.target.value) });
                }}
                className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#ffd200] focus:outline-none text-lg"
              />
            </div>
            
            <button
              onClick={nextStep}
              disabled={!quizData.ticket}
              className="w-full bg-[#ffd200] text-[#191919] p-4 rounded-lg font-bold text-lg hover:bg-[#ffdc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={prevStep}
              className="w-full mt-4 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela 4 - Taxa de Conversão
  if (currentStep === 4) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Qual sua taxa média de conversão de leads em contratos?
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              A cada 10 contatos que você recebe, quantos viram contratos?
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div className="bg-[#ffd200] h-2 rounded-full" style={{ width: '66.66%' }}></div>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(TAXA_CONVERSAO_MAP).map(([label, value]) => (
              <button
                key={label}
                onClick={() => {
                  setQuizData({ ...quizData, taxa_conversao: value });
                  nextStep();
                }}
                className="w-full bg-gray-800 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-left border border-gray-700 hover:border-[#ffd200]"
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={prevStep}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela 5 - Faturamento Atual
  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Qual o faturamento mensal do seu escritório?
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Considere a receita bruta mensal atual do seu escritório
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div className="bg-[#ffd200] h-2 rounded-full" style={{ width: '83.33%' }}></div>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(FATURAMENTO_MAP).map(([label, value]) => (
              <button
                key={label}
                onClick={() => {
                  setQuizData({ ...quizData, faturamento_atual: value });
                  startLoading();
                }}
                className="w-full bg-gray-800 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors text-left border border-gray-700 hover:border-[#ffd200]"
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={prevStep}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela de Loading
  if (currentStep === 6 && isLoading) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#ffd200]/20 blur-xl rounded-full animate-pulse"></div>
            <Calculator className="relative w-20 h-20 text-[#ffd200] mx-auto animate-bounce" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Com base nas suas respostas, estamos calculando o valor (estimado) que você está deixando na mesa todos os meses...
          </h2>
          
          <div className="mb-8">
            <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#ffd200] to-[#ffdc33] h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(loadingProgress, 100)}%` }}
              ></div>
            </div>
            <div className="text-[#ffd200] text-2xl font-bold">
              {Math.round(Math.min(loadingProgress, 100))}%
            </div>
          </div>
          
          <div className="space-y-2 text-gray-400">
            <div className={`flex items-center justify-center gap-2 transition-opacity duration-500 ${loadingProgress > 20 ? 'opacity-100' : 'opacity-50'}`}>
              <div className="w-2 h-2 bg-[#ffd200] rounded-full animate-pulse"></div>
              <span>Analisando sua área de atuação...</span>
            </div>
            <div className={`flex items-center justify-center gap-2 transition-opacity duration-500 ${loadingProgress > 50 ? 'opacity-100' : 'opacity-50'}`}>
              <div className="w-2 h-2 bg-[#ffd200] rounded-full animate-pulse"></div>
              <span>Calculando potencial de leads...</span>
            </div>
            <div className={`flex items-center justify-center gap-2 transition-opacity duration-500 ${loadingProgress > 80 ? 'opacity-100' : 'opacity-50'}`}>
              <div className="w-2 h-2 bg-[#ffd200] rounded-full animate-pulse"></div>
              <span>Gerando seu diagnóstico personalizado...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela 7 - Dados Pessoais (Unificada)
  if (currentStep === 7) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4 relative">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Para receber o resultado, deixe aqui seus dados
            </h2>
            <p className="text-gray-300 mb-4">Receba seu diagnóstico personalizado</p>
            <p className="text-gray-400 text-sm mb-4">
              🔒 Seus dados estão seguros e serão usados apenas para enviar o diagnóstico
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div className="bg-[#ffd200] h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <div>
              <User className="w-6 h-6 text-[#ffd200] mb-2" />
              <input
                type="text"
                placeholder="Seu nome completo"
                value={quizData.nome}
                onChange={(e) => setQuizData({ ...quizData, nome: e.target.value })}
                className="w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#ffd200] focus:outline-none text-lg"
              />
            </div>

            <div>
              <Mail className="w-6 h-6 text-[#ffd200] mb-2" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={quizData.email}
                onChange={(e) => {
                  setQuizData({ ...quizData, email: e.target.value });
                  validateEmail(e.target.value);
                }}
                className={`w-full p-4 bg-gray-700 text-white rounded-lg border ${emailError ? 'border-red-500' : 'border-gray-600'} focus:border-[#ffd200] focus:outline-none text-lg`}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <Phone className="w-6 h-6 text-[#ffd200] mb-2" />
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={quizData.whatsapp}
                onChange={(e) => {
                  const formatted = formatWhatsApp(e.target.value);
                  setQuizData({ ...quizData, whatsapp: formatted });
                  validateWhatsApp(formatted);
                }}
                className={`w-full p-4 bg-gray-700 text-white rounded-lg border ${whatsappError ? 'border-red-500' : 'border-gray-600'} focus:border-[#ffd200] focus:outline-none text-lg`}
              />
              {whatsappError && (
                <p className="text-red-500 text-sm mt-1">{whatsappError}</p>
              )}
            </div>
            
            <button
              onClick={() => {
                if (validateWhatsApp(quizData.whatsapp) && validateEmail(quizData.email)) {
                  setCurrentStep(8); // Vai para resultado final
                  sendWebhook();
                  navigate('/resultado');
                }
              }}
              disabled={!quizData.nome || !quizData.email || !quizData.whatsapp || isLoading || !!whatsappError || !!emailError}
              className="w-full bg-[#ffd200] text-[#191919] p-4 rounded-lg font-bold text-lg hover:bg-[#ffdc33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? 'Processando...' : 'Ver Resultado'}
              <Calculator className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Tela 8 - Resultado Final
  if (currentStep === 8) {
    const results = calculateResults();
    
    return (
      <div className="min-h-screen bg-[#191919] flex flex-col items-center justify-between p-4 relative">
        <div className="max-w-4xl w-full">
          {/* Hero Section com Resultado */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ffd200]/10 to-transparent"></div>
            <div className="relative max-w-6xl mx-auto px-4 py-16">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-[#ffd200]/20 px-4 py-2 rounded-full mb-6">
                  <Trophy className="w-5 h-5 text-[#ffd200]" />
                  <span className="text-[#ffd200] font-semibold">DIAGNÓSTICO COMPLETO</span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  {getFirstName(quizData.nome || 'Advogado')}, este é o valor em contratos que você está 
                  <span className="text-[#ffd200]"> deixando na mesa</span> todos os meses:
                </h1>
                
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-[#ffd200]/20 blur-xl rounded-full animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-[#ffd200] to-[#ffdc33] text-[#191919] p-8 rounded-2xl shadow-2xl">
                    <div className="text-2xl font-bold mb-2">💰</div>
                    <div className="text-4xl md:text-6xl font-black">
                      {formatCurrency(results.valorDeixadoNaMesa)}
                    </div>
                    <div className="text-lg font-semibold mt-2 opacity-80">
                      por mês em oportunidades perdidas
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas Visuais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Contratos</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-400 mb-2">{results.contratosPosse}</div>
                  <p className="text-gray-400">novos contratos por mês</p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-8 h-8 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Potencial Total</h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-400 mb-2">{formatCurrency(results.faturamentoPotencial)}</div>
                  <p className="text-gray-400">faturamento mensal possível</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Problema/Solução */}
          <div className="bg-gray-900/50 py-16">
            <div className="max-w-4xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  A Verdade Que Ninguém Te Conta
                </h2>
              </div>

              <div className="space-y-8 text-lg text-gray-300 leading-relaxed">
                <div className="bg-gray-800/50 p-8 rounded-xl border-l-4 border-[#ffd200]">
                  <p className="text-xl mb-4 text-white font-semibold">
                    Você já entendeu: <strong>não é sobre ser um bom advogado.</strong>
                  </p>
                  <p className="text-xl mb-4">
                    É sobre <strong className="text-[#ffd200]">ser percebido como insubstituível.</strong>
                  </p>
                  <p className="text-xl">
                    E hoje… você ainda parece <strong>só mais um na multidão.</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <p>
                      Você estudou. Se formou. Fez pós, especializações, se dedicou à sua área...
                      <br />
                      Mas ainda <strong>depende do acaso ou de indicações</strong> para manter o escritório girando.
                    </p>

                    <p>
                      Enquanto isso, tem colegas com <strong>menos experiência</strong>, <strong>menos formação</strong>...
                    </p>

                    <p className="text-2xl text-[#ffd200] font-bold">
                      …<strong>faturando 3x mais que você</strong>.
                    </p>
                  </div>

                  <div className="bg-red-900/30 p-6 rounded-xl border border-red-500/30">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🛑</div>
                      <h2 className="text-[#ff4444] text-2xl font-bold mb-2 text-center">
                        VOCÊ ESTÁ DEIXANDO DINHEIRO NA MESA TODOS OS MESES.
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-8 rounded-xl">
                  <p className="text-xl mb-6 text-center">
                    Não por falta de conhecimento jurídico.
                    <br />
                    Mas por falta de <strong className="text-[#ffd200]">estrutura.</strong>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-red-900/20 rounded-lg">
                      <span className="text-red-400 text-xl">❌</span>
                      <span>Falta um processo previsível para atrair os clientes certos</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-red-900/20 rounded-lg">
                      <span className="text-red-400 text-xl">❌</span>
                      <span>Falta uma oferta que mostre o valor do seu serviço</span>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-red-900/20 rounded-lg">
                      <span className="text-red-400 text-xl">❌</span>
                      <span>Falta um posicionamento estratégico para te fazer visto como referência absoluta</span>
                    </div>
                  </div>
                </div>

                <div className="text-center bg-gray-800/50 p-8 rounded-xl">
                  <p className="text-xl mb-4">
                    Hoje, sua autoridade é <strong>jurídica</strong>.
                    <br />
                    Mas o cliente compra <strong className="text-[#ffd200]">percepção de valor</strong>.
                  </p>
                  
                  <p className="text-lg">
                    E por mais que você se esforce, hoje você ainda é visto <strong>como mais um</strong>…
                    <br />
                    … e não como <strong className="text-[#ffd200]">o único caminho seguro</strong> para o resultado que ele quer.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-[#ffd200]/10 to-transparent p-8 rounded-xl border border-[#ffd200]/30">
                  <div className="space-y-4 text-white">
                    <div className="flex items-center gap-2">
                      <X className="text-red-500 w-6 h-6 flex-shrink-0" />
                      <p className="text-lg">O problema <span className="font-bold">não</span> é o Google.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <X className="text-red-500 w-6 h-6 flex-shrink-0" />
                      <p className="text-lg">O problema <span className="font-bold">não</span> é o Instagram.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <X className="text-red-500 w-6 h-6 flex-shrink-0" />
                      <p className="text-lg">O problema <span className="font-bold">não</span> é você.</p>
                    </div>

                    <div className="bg-[#ffd200]/20 p-4 rounded-lg mt-6">
                      <p className="text-lg text-[#ffd200]">
                        O problema é a ausência de um <strong>modelo de crescimento previsível e lucrativo.</strong>
                      </p>
                    </div>

                    <div className="mt-6 text-center mb-12">
                      <p className="text-lg">
                        📝 E é exatamente isso que <strong>nós podemos te mostrar.</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-center bg-green-900/20 p-8 rounded-xl border border-green-500/30">
                    <p className="text-xl font-bold text-green-400 mb-4">
                      ✅ Já ajudamos dezenas de advogados a crescer.
                    </p>
                    <p className="text-lg">
                      E a boa notícia é: <strong>você pode acessar o mesmo caminho agora.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Final */}
          <div className="bg-gradient-to-r from-[#ffd200]/20 to-transparent py-16">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="mb-8">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  💬 Quer aplicar isso no seu escritório?
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  👇 Clique abaixo para falar com um especialista e agendar um horário:
                </p>
              </div>
              
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-green-500/20 blur-lg rounded-xl animate-pulse"></div>
                <a
                  href="https://wa.me/5511963443866?text=Ola%2C%20preenchi%20o%20Quiz%20e%20quero%20conhecer%20mais%20detalhes%20sobre%20a%20Assessoria%20em%20Marketing%20Jur%C3%ADdico%20da%20Digge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-base hover:bg-green-700 transition-all duration-300 flex items-center gap-2 mx-auto shadow-xl transform hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar com um Especialista no WhatsApp
                </a>
              </div>

              <p className="text-gray-400 mt-6 text-sm">
                🔒 Conversa 100% confidencial e sem compromisso
              </p>
            </div>
          </div>
        </div>

        <div className="w-full bg-[#191919] py-8 mt-16">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
            <img 
              src="https://digge.com.br/wp-content/uploads/2024/11/Logo.png" 
              alt="Digge Logo" 
              className="h-8 mb-4"
            />
            <p className="text-gray-500 text-sm">CNPJ: 49.139.333/0001-95</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - não deveria chegar aqui
  return (
    <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Erro inesperado</h2>
        <p>Tela atual: {currentStep}</p>
        <button 
          onClick={() => setCurrentStep(0)}
          className="mt-4 bg-[#ffd200] text-[#191919] px-6 py-3 rounded-lg font-bold"
        >
          Reiniciar Quiz
        </button>
      </div>
    </div>
  );
}

export default App;