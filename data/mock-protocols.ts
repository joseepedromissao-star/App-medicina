/**
 * AuraMed - Protocolos Clínicos de Emergência (demonstração, alinhados ao prompt v2)
 *
 * Regras deste arquivo:
 *  - Doses, taxas e diluições NÃO são digitadas aqui: o motor (lib/conduta-engine.ts) as calcula a partir do
 *    registro de fármacos e dos presets. Por isso calculatedDose/dilution ficam vazios nos itens com fármaco.
 *  - Cada recomendação tem `fonte` e `statusRecomendacao` ('CONFIRMADA' | 'VERIFICAR').
 *  - Referências são apenas guidelines/consensos oficiais (nome + sociedade + ano), sem autores individuais.
 *  - Todo protocolo está com validacaoClinica 'PENDENTE' até revisão médica.
 *  - Scores já implementados em scores.ts vão em associatedScores; os previstos vão em scoresPlanejados.
 */

import type { Patologia } from '../types/clinical';

const REVISADO_EM = '2026-10-06';
const SSC_2026 = 'Surviving Sepsis Campaign: Adult Guidelines 2026';
const ATS_2025 = 'ATS 2025 (atualização parcial da diretriz de PAC)';
const ATS_IDSA_2019 = 'ATS/IDSA 2019 (PAC em adultos)';

export const CLINICAL_PROTOCOLS: Patologia[] = [
  // ---------------------------------------------------------------------------
  {
    id: 'choque_septico',
    title: 'Choque Séptico & Sepse Grave',
    synonyms: ['Sepse', 'Choque Distributivo', 'Sepsis-3'],
    specialty: 'Sepse & Choque',
    cid10: ['A41.9', 'R57.2'],
    guidelines: [
      { nome: 'Surviving Sepsis Campaign: Adult Guidelines', sociedade: 'SCCM/ESICM', ano: 2026, status: 'CONFIRMADA' },
      { nome: 'Sepsis-3: Third International Consensus Definitions', sociedade: 'SCCM/ESICM', ano: 2016, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Antimicrobiano em < 60 min no choque séptico e na sepse provável/definida',
    targetTimeWarning: 'O atraso no antimicrobiano adequado em sepse e choque séptico associa-se a maior mortalidade.',
    statusBadge: 'Padrão Ouro',
    severity: 'critical',
    summary:
      'Sepse: disfunção orgânica potencialmente fatal causada por resposta desregulada do hospedeiro à infecção. Choque séptico: subtipo com hipotensão que exige vasopressor para manter a PAM-alvo e lactato elevado apesar da reposição volêmica adequada.',
    diagnosticCriteria: {
      symptoms: [
        'Hipotensão arterial (PAS < 90 ou PAM < 65 mmHg)',
        'Taquipneia ou dispneia súbita',
        'Alteração do estado mental (confusão, sonolência)',
        'Oligúria (< 0,5 mL/kg/h) ou anúria',
        'Tempo de enchimento capilar prolongado / pele marmórea',
      ],
      mandatoryFindings: [
        'Suspeita ou confirmação de foco infeccioso',
        'Triagem por NEWS/NEWS2, MEWS ou SIRS (o qSOFA isolado não é recomendado como ferramenta única de triagem)',
        'Necessidade de vasopressor para a PAM-alvo após reposição volêmica (define choque séptico)',
        'Lactato sérico inicial (elevado > 2 mmol/L sustenta hipoperfusão)',
      ],
      redFlags: [
        'Lactato sérico > 4,0 mmol/L',
        'Glasgow ≤ 8 (risco de perda de via aérea; considerar proteção de via aérea)',
        'Necessidade crescente de noradrenalina',
        'Sinais de coagulopatia (CIVD) ou plaquetopenia aguda',
      ],
    },
    associatedScores: ['news2', 'qsofa'], // NEWS2 para triagem preferencial (SSC 2026); qSOFA complementar
    scoresPlanejados: ['mews', 'sirs', 'sofa'],
    associatedDrugs: ['noradrenalina', 'vasopressina', 'dobutamina'],
    conductPhases: [
      {
        phaseTitle: 'Reconhecimento e Ressuscitação Imediata',
        timeWindow: '0 - 60 minutos',
        items: [
          {
            id: 'cs-0',
            title: 'Triagem de sepse com NEWS2 / MEWS / SIRS',
            detail:
              'Triar com escore de alerta precoce (NEWS/NEWS2, MEWS) ou SIRS. O qSOFA, se usado, é complementar: resultado negativo NÃO exclui sepse.',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: SSC_2026,
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'cs-1',
            title: 'Coleta de Lactato Sérico Inicial',
            detail: 'Repetir para avaliar depuração conforme a evolução clínica [intervalo e meta a confirmar no texto da guideline].',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'cs-2',
            title: 'Hemoculturas Antes do Antimicrobiano',
            detail: 'Coletar culturas de acordo com o foco, sem atrasar o antimicrobiano além do tempo-limite da guideline [limite de tempo a confirmar].',
            priority: 'emergency',
            timing: '< 30 min',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'cs-3',
            title: 'Antimicrobiano de Amplo Espectro na 1ª Hora',
            detail:
              'Primeira dose intravenosa em até 1 hora no choque séptico e na sepse provável/definida, cobrindo os patógenos prováveis conforme o foco. Esquema e doses: cadastrar no registro de fármacos e validar.',
            priority: 'emergency',
            timing: '< 60 min',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'cs-4',
            title: 'Expansão Volêmica com Cristaloide Balanceado',
            detail:
              'Cristaloide (preferência por balanceado) em volume por kg conforme a guideline [volume e janela a confirmar no texto de 2026]. Reavaliar responsividade a volume; cautela em insuficiência cardíaca e doença renal.',
            priority: 'emergency',
            timing: '< 60 min',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'cs-5',
            title: 'Vasopressor Precoce (Noradrenalina)',
            detail:
              'Iniciar noradrenalina em bomba de infusão contínua se a PAM-alvo não for atingida com a reposição volêmica, sem aguardar o término da expansão em hipotensão grave [conferir texto da guideline]. Meta de PAM: 65 mmHg, aceitando ±5; em ≥ 65 anos, a guideline sugere 60–65 mmHg.',
            priority: 'emergency',
            timing: '< 30 min',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
            drugPrescription: {
              drugId: 'noradrenalina',
              drugName: 'Noradrenalina (Hemitartarato)',
              calculatedDose: '', // preenchido pelo motor (preset padrão)
              route: 'EV em BIC contínua',
              dilution: '', // preenchido pelo motor (preset padrão)
              safetyDoubleCheck: true,
              targetParameter: 'PAM-alvo (SSC 2026: 65 mmHg, ±5; 60–65 mmHg se ≥ 65 anos)',
            },
          },
        ],
      },
      {
        phaseTitle: 'Estabilização e Suporte Avançado',
        timeWindow: '1 - 6 horas',
        items: [
          {
            id: 'cs-6',
            title: 'Acesso Central e Pressão Arterial Invasiva',
            detail:
              'Garantir acesso seguro para vasoativos e monitorização contínua da PAM. Não atrasar o início do vasopressor à espera do acesso central: início por via periférica conforme protocolo institucional [conferir texto da guideline].',
            priority: 'high',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'cs-7',
            title: 'Associar Vasopressina como 2º Vasopressor',
            detail:
              'A guideline sugere adicionar vasopressina em vez de escalar a noradrenalina; o limiar habitual fica na faixa de 0,25–0,5 mcg/kg/min de noradrenalina [confirmar limiar e dose no texto de 2026].',
            priority: 'high',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
            drugPrescription: {
              drugId: 'vasopressina',
              drugName: 'Vasopressina',
              calculatedDose: '', // preenchido pelo motor
              route: 'EV em BIC contínua',
              dilution: '', // preenchido pelo motor
              safetyDoubleCheck: true,
              targetParameter: 'Poupador de catecolaminas',
            },
          },
          {
            id: 'cs-8',
            title: 'Avaliar Inotrópico (Dobutamina) ou Adrenalina Adjuvante',
            detail:
              'Se houver disfunção cardíaca com hipoperfusão persistente apesar de volume e vasopressores, considerar dobutamina ou adrenalina (evidência de certeza muito baixa) [confirmar no texto da guideline]. Confirmar a disfunção por ecocardiograma à beira-leito.',
            priority: 'high',
            fonte: SSC_2026,
            statusRecomendacao: 'VERIFICAR',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Necessidade de vasopressor para manutenção da PAM',
      'Hipoperfusão persistente (lactato elevado ou em ascensão)',
      'Necessidade de suporte ventilatório invasivo ou de alto fluxo',
      'Disfunção orgânica multissistêmica progressiva',
      '(critérios finais de admissão: definir conforme protocolo institucional)',
    ],
    references: [
      'Surviving Sepsis Campaign (SCCM/ESICM): Adult Guidelines for the Management of Sepsis and Septic Shock, 2026.',
      'Sepsis-3 (SCCM/ESICM): Third International Consensus Definitions for Sepsis and Septic Shock, 2016.',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'sca_iam_sst',
    title: 'Síndrome Coronariana Aguda sem Supra de ST',
    synonyms: ['SCA sem SST', 'Angina Instável', 'IAM sem Supra'],
    specialty: 'Cardiologia',
    cid10: ['I20.0', 'I21.4'],
    guidelines: [
      { nome: 'ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Acute Coronary Syndromes', sociedade: 'ACC/AHA', ano: 2025, status: 'VERIFICAR' },
      { nome: 'ESC Guidelines for the Management of Acute Coronary Syndromes', sociedade: 'ESC', ano: 2023, status: 'VERIFICAR' },
      { nome: 'Diretriz de Síndromes Coronarianas Agudas sem Supra de ST (edição vigente)', sociedade: 'SBC', ano: 2021, status: 'VERIFICAR' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'ECG em < 10 min | Estratificação precoce conforme risco',
    targetTimeWarning: 'Atraso no ECG e na estratificação eleva eventos isquêmicos recorrentes e arritmias ventriculares.',
    statusBadge: 'Alta Prioridade',
    severity: 'high',
    summary:
      'Espectro isquêmico agudo por instabilização de placa aterosclerótica sem oclusão transmural persistente, com dor anginosa, alterações de repolarização e/ou elevação de troponina.',
    diagnosticCriteria: {
      symptoms: [
        'Dor precordial opressiva ou em queimação, com irradiação para MSE, mandíbula ou dorso',
        'Dor em repouso prolongada ou em crescendo recente',
        'Equivalentes anginosos: dispneia súbita, sudorese fria, náuseas sem causa aparente',
      ],
      mandatoryFindings: [
        'ECG de 12 derivações em até 10 minutos, com análise de supra de ST (que muda a via de conduta)',
        'Troponina de alta sensibilidade seriada, em algoritmo validado (0h/1h ou 0h/2h)',
      ],
      redFlags: [
        'Instabilidade hemodinâmica, choque cardiogênico ou Killip III/IV',
        'Angina refratária ao tratamento clínico',
        'Arritmias ventriculares sustentadas ou parada cardiorrespiratória revertida',
      ],
    },
    associatedScores: ['heart_score', 'timi_sca', 'grace_score'],
    scoresPlanejados: [],
    associatedDrugs: ['enoxaparina'],
    conductPhases: [
      {
        phaseTitle: 'Conduta Imediata no Pronto-Socorro',
        timeWindow: '0 - 30 minutos',
        items: [
          {
            id: 'sca-1',
            title: 'ECG de 12 derivações em < 10 min',
            detail:
              'Procurar infradesnivelamento de ST, inversão de onda T ou alteração dinâmica; descartar supra de ST. Se dor contínua e ECG inicial normal, considerar derivações posteriores e direitas e repetir o ECG.',
            priority: 'emergency',
            timing: '< 10 min',
            fonte: 'Guidelines de SCA (ACC/AHA 2025, ESC 2023)',
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'sca-2',
            title: 'Antiagregação Plaquetária',
            detail:
              'AAS de ataque [dose conforme guideline adotada; confirmar a faixa]. Inibidor de P2Y12: o momento de início depende da estratégia — a ESC 2023 não recomenda pré-tratamento de rotina quando se planeja estratégia invasiva precoce com anatomia desconhecida; confirmar a posição da ACC/AHA 2025 e do protocolo local antes de prescrever.',
            priority: 'emergency',
            timing: '< 30 min',
            fonte: 'ESC 2023; ACC/AHA 2025 (conferir)',
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'sca-3',
            title: 'Anticoagulação Parenteral',
            detail:
              'Anticoagulação parenteral conforme a estratégia (HBPM ou HNF). Dose e ajuste renal são calculados pelo motor a partir do registro de fármacos [confirmar regime por indicação].',
            priority: 'emergency',
            fonte: 'Guidelines de SCA (conferir)',
            statusRecomendacao: 'VERIFICAR',
            drugPrescription: {
              drugId: 'enoxaparina',
              drugName: 'Enoxaparina Sódica',
              calculatedDose: '', // preenchido pelo motor (registro de fármacos)
              route: 'SC',
              dilution: 'Seringa pré-cheia (sem diluição)',
              safetyDoubleCheck: true,
              targetParameter: 'Anticoagulação sem sangramento',
            },
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Instabilidade hemodinâmica ou arritmias ventriculares',
      'Angina refratária ou sinais de choque cardiogênico',
      'Alto risco isquêmico/hemodinâmico conforme escores e protocolo institucional (HEART alto indica alto risco de eventos, não é critério isolado de UTI)',
    ],
    references: [
      'ACC/AHA/ACEP/NAEMSP/SCAI: Guideline for the Management of Patients With Acute Coronary Syndromes, 2025 (conferir edição).',
      'ESC: Guidelines for the Management of Acute Coronary Syndromes, 2023.',
      'SBC: Diretriz de Síndromes Coronarianas Agudas sem Supra de ST (edição vigente).',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'pac_grave',
    title: 'Pneumonia Adquirida na Comunidade (PAC)',
    synonyms: ['PAC', 'Pneumonia Comunitária', 'Infecção do Trato Respiratório Inferior'],
    specialty: 'Pneumologia',
    cid10: ['J18.9'],
    guidelines: [
      { nome: 'Atualização parcial da diretriz de PAC (4 questões)', sociedade: 'ATS', ano: 2025, status: 'CONFIRMADA' },
      { nome: 'Diagnosis and Treatment of Adults with Community-acquired Pneumonia', sociedade: 'ATS/IDSA', ano: 2019, status: 'CONFIRMADA' },
      { nome: 'Diretriz brasileira de PAC (edição vigente)', sociedade: 'SBPT/SBI', ano: 2018, status: 'VERIFICAR' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Antibiótico precoce; < 1 hora se houver sepse/choque séptico',
    targetTimeWarning: 'Atraso na antibioticoterapia em pacientes com sepse ou choque séptico associados à pneumonia aumenta a mortalidade.',
    statusBadge: 'Protocolo Institucional',
    severity: 'moderate',
    summary:
      'Infecção aguda do parênquima pulmonar adquirida na comunidade, com consolidação radiológica, tosse, febre e necessidade de estratificar a gravidade (CURB-65, PSI e critérios ATS/IDSA) para definir o local de tratamento.',
    diagnosticCriteria: {
      symptoms: [
        'Tosse com expectoração purulenta ou ferruginosa',
        'Febre (> 38 °C) ou hipotermia em idosos',
        'Dispneia, taquipneia ou dor pleurítica',
        'Estertores crepitantes, macicez à percussão ou sopro tubário',
      ],
      mandatoryFindings: [
        'Imagem com novo infiltrado/consolidação: radiografia de tórax; o ultrassom pulmonar é alternativa diagnóstica (ATS 2025)',
        'Estratificação de gravidade (CURB-65 e/ou PSI e critérios ATS/IDSA) para definir o local de tratamento',
        'Triagem de sepse (NEWS2/MEWS/SIRS) em pacientes internados',
      ],
      redFlags: [
        'CURB-65 ≥ 3 pontos ou PSI Classe IV-V',
        'Critérios ATS/IDSA de PAC grave (1 critério maior ou ≥ 3 menores)',
        'SpO2 < 90% em ar ambiente ou PaO2/FiO2 ≤ 250',
        'Choque séptico ou necessidade de suporte ventilatório invasivo',
        'NEWS2 ≥ 7 pontos (alto risco clínico)',
      ],
    },
    associatedScores: ['curb_65', 'ats_idsa_pac_grave', 'psi_port', 'news2'],
    scoresPlanejados: [],
    associatedDrugs: ['ceftriaxona', 'azitromicina', 'amoxicilina', 'levofloxacino'],
    conductPhases: [
      {
        phaseTitle: 'Estratificação e Antibioticoterapia',
        timeWindow: '0 - 60 minutos',
        items: [
          {
            id: 'pac-1',
            title: 'Estratificar a Gravidade e Definir Local de Tratamento',
            detail:
              'CURB-65 (confusão, ureia > 42 mg/dL, FR ≥ 30, PAS < 90 ou PAD ≤ 60, idade ≥ 65) e/ou PSI para o local de tratamento (ambulatorial vs enfermaria); critérios ATS/IDSA 2019 de PAC grave (1 maior ou ≥ 3 menores) para indicação de UTI; triagem de sepse com NEWS2.',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: ATS_IDSA_2019,
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pac-2',
            title: 'Início Precoce de Antimicrobiano Empírico',
            detail:
              'Esquema empírico conforme a gravidade e o local de tratamento (ATS/IDSA 2019: β-lactâmico + macrolídeo, ou fluoroquinolona respiratória, em internados não graves). Doses por peso e função renal serão calculadas quando os fármacos forem cadastrados no registro e validados.',
            priority: 'emergency',
            timing: '< 60 min',
            fonte: ATS_IDSA_2019,
            statusRecomendacao: 'VERIFICAR',
          },
          {
            id: 'pac-3',
            title: 'Duração do Tratamento',
            detail:
              'Em pacientes estáveis com PAC não grave, a ATS 2025 sugere tratamento curto de 3 a 5 dias (recomendação condicional), com reavaliação clínica antes da suspensão.',
            priority: 'high',
            fonte: ATS_2025,
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pac-4',
            title: 'Corticoide Sistêmico',
            detail:
              'ATS 2025: recomendação forte contra corticoide sistêmico em internados com PAC NÃO grave; o uso fica restrito à PAC grave internada, e não é sugerido de rotina na pneumonia grave por influenza. Tema em evolução: estudo REMAP-CAP de 2025 não mostrou benefício significativo, e recomendações futuras podem mudar.',
            priority: 'high',
            fonte: ATS_2025,
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Choque séptico com necessidade de vasopressor (critério maior ATS/IDSA)',
      'Insuficiência respiratória com ventilação mecânica invasiva (critério maior ATS/IDSA)',
      'Critérios ATS/IDSA de PAC grave (1 critério maior ou ≥ 3 menores) [conferir contagem no texto da guideline]',
    ],
    references: [
      'ATS: atualização parcial da diretriz de pneumonia adquirida na comunidade, 2025.',
      'ATS/IDSA: Diagnosis and Treatment of Adults with Community-acquired Pneumonia, 2019.',
      'SBPT/SBI: diretriz brasileira de pneumonia adquirida na comunidade (edição vigente).',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'tep_agudo',
    title: 'Tromboembolismo Pulmonar Agudo (TEP)',
    synonyms: ['TEP', 'Embolia Pulmonar', 'Tromboembolismo Venoso', 'TEV'],
    specialty: 'Pneumologia',
    cid10: ['I26.0', 'I26.9'],
    guidelines: [
      { nome: 'Guideline for the Evaluation and Management of Acute Pulmonary Embolism in Adults', sociedade: 'AHA/ACC/CHEST/SCAI/SVM', ano: 2026, status: 'CONFIRMADA' },
      { nome: 'ESC Guidelines for the Diagnosis and Management of Acute Pulmonary Embolism', sociedade: 'ESC', ano: 2019, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Anticoagulação imediata na suspeita alta; Reperfusão de emergência se Choque (Cat E)',
    targetTimeWarning: 'O atraso na anticoagulação ou na reperfusão no choque cardiogênico eleva exponencialmente a mortalidade precoce.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Oclusão aguda da circulação arterial pulmonar por trombos do sistema venoso profundo. A estratificação segue as novas Categorias Clínicas AHA/ACC 2026 (A a E), que substituem a classificação binária antiga e orientam o local de cuidado, anticoagulação preferencial (HBPM vs DOACs vs HNF) e terapias avançadas de reperfusão.',
    diagnosticCriteria: {
      symptoms: [
        'Dispneia de início súbito e dor torácica pleurítica',
        'Taquipneia sustentada (> 20 irpm) e taquicardia sinusal inexplicada',
        'Síncope ou pré-síncope (sinal de comprometimento hemodinâmico)',
        'Hemoptise e tosse aguda',
        'Sinais unilaterais de TVP (edema assimétrico, dor em panturrilha)',
      ],
      mandatoryFindings: [
        'Estratificação de probabilidade pré-teste pelo Escore de Wells (≤ 4: improvável; > 4: provável)',
        'Se Wells ≤ 4: D-dímero de alta sensibilidade (ajustado pela idade se > 50 anos: idade × 10 mcg/L); se normal, TEP excluído',
        'Se Wells > 4 ou D-dímero elevado: Angiotomografia de artérias pulmonares (exame padrão-ouro)',
        'Avaliação de disfunção de ventrículo direito: ecocardiograma transtorácico ou relação VD/VE na angio-TC',
        'Biomarcadores cardíacos de necrose e estiramento: Troponina ultrassensível e BNP/NT-proBNP',
      ],
      redFlags: [
        'Falência cardiopulmonar / Choque cardiogênico com hipotensão persistente (AHA/ACC Categoria E1/E2)',
        'Falência cardiopulmonar incipiente: choque normotensivo com lactato elevado (Categoria D2) ou hipotensão transitória (D1)',
        'Disfunção de VD combinada com troponina ou BNP elevados (Categoria C3)',
        'Síncope na apresentação clínica inicial',
        'PCR ou AESP associada à hipoxemia grave',
      ],
    },
    associatedScores: ['aha_acc_2026_tep', 'wells_tep', 'spesi'],
    scoresPlanejados: [],
    associatedDrugs: ['enoxaparina', 'heparina_nf', 'alteplase'],
    conductPhases: [
      {
        phaseTitle: 'Estratificação Diagnóstica e Mobilização (0 - 30 min)',
        timeWindow: '0 - 30 minutos',
        items: [
          {
            id: 'tep-1',
            title: 'Probabilidade Pré-Teste com Escore de Wells',
            detail:
              'Calcular Escore de Wells. Se ≤ 4 (improvável), solicitar D-dímero com ponto de corte ajustado pela idade (> 50 anos: idade × 10 mcg/L) — se normal, TEP está descartado sem imagem. Se > 4 (provável), prosseguir diretamente para Angiotomografia Pulmonar sem aguardar D-dímero.',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: 'AHA/ACC 2026 / ESC 2019',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'tep-2',
            title: 'Classificação nas Categorias Clínicas AHA/ACC 2026 (A a E) & PERT',
            detail:
              'Estratificar o paciente confirmado em Categorias A a E da diretriz AHA/ACC 2026. Para Categorias C, D e E, a convocação do time multidisciplinar de resposta a embolia pulmonar (PERT) é recomendação Classe 1 da diretriz.',
            priority: 'emergency',
            timing: '< 30 min',
            fonte: 'AHA/ACC 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Anticoagulação e Terapias Avançadas de Reperfusão (30 - 60 min)',
        timeWindow: '30 - 60 minutos',
        items: [
          {
            id: 'tep-3',
            title: 'Anticoagulação Parenteral Imediata',
            detail:
              'Iniciar anticoagulação plena enquanto aguarda confirmação se probabilidade clínica for alta. A diretriz AHA/ACC 2026 traz recomendação de Classe 1 preferindo Heparina de Baixo Peso Molecular (Enoxaparina 1 mg/kg SC q12h) sobre HNF em pacientes sem indicação de reperfusão imediata. Reservar HNF em infusão para candidatos a reperfusão avançada (Cat D e E) ou com ClCr < 30 mL/min.',
            priority: 'emergency',
            timing: '< 30 min',
            fonte: 'AHA/ACC 2026 (Recomendação Classe 1)',
            statusRecomendacao: 'CONFIRMADA',
            drugPrescription: {
              drugId: 'enoxaparina',
              drugName: 'Enoxaparina Sódica (HBPM)',
              calculatedDose: '', // preenchido pelo motor
              route: 'SC',
              dilution: 'Seringa pré-cheia sem diluição',
              safetyDoubleCheck: true,
              targetParameter: 'Anticoagulação plena sem sangramento',
            },
          },
          {
            id: 'tep-4',
            title: 'Terapias Avançadas de Reperfusão (Trombólise / Cateter / Cirurgia)',
            detail:
              'Para Categoria E1/E2 (falência cardiopulmonar / choque cardiogênico): trombólise sistêmica com Alteplase 100 mg EV em 2 horas (ou 0,6 mg/kg em 15 min em PCR / choque catastrófico, máx 50 mg). Em Categoria D1/D2 ou C3 com deterioração ou alto risco de sangramento: avaliar trombectomia mecânica por cateter ou trombólise direcionada por cateter (CDT) junto ao PERT.',
            priority: 'emergency',
            timing: '< 60 min',
            fonte: 'AHA/ACC 2026 / ESC 2019',
            statusRecomendacao: 'CONFIRMADA',
            drugPrescription: {
              drugId: 'alteplase',
              drugName: 'Alteplase (rt-PA)',
              calculatedDose: '100 mg',
              route: 'EV em BIC contínua',
              dilution: '100 mg em 100 mL de água para injeção (1 mg/mL) em 2 horas',
              safetyDoubleCheck: true,
              targetParameter: 'Desobstrução vascular pulmonar e alívio de pós-carga de VD',
            },
          },
        ],
      },
      {
        phaseTitle: 'Suporte Hemodinâmico do Ventrículo Direito e UTI (1 - 24 h)',
        timeWindow: '1 - 24 horas',
        items: [
          {
            id: 'tep-5',
            title: 'Otimização Hemodinâmica e Manejo de Fluidos',
            detail:
              'EVITAR sobrecarga hídrica excessiva no ventrículo direito (a dilatação aguda de VD piora o débito cardíaco por interdependência ventricular). Alíquotas pequenas (≤ 250–500 mL) apenas se hipovolemia. Noradrenalina precoce para manter a pressão de perfusão coronariana do VD.',
            priority: 'high',
            timing: '< 2 horas',
            fonte: 'AHA/ACC 2026 / ESC 2019',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'tep-6',
            title: 'Transição Terapêutica para Anticoagulante Oral (DOACs)',
            detail:
              'Em pacientes estabilizados elegíveis (Categorias A, B e C), os anticoagulantes orais de ação direta (DOACs — Apixabana ou Rivaroxabana) são a modalidade preferida de Classe 1 sobre antagonistas de vitamina K (varfarina), dispensando monitorização laboratorial frequente.',
            priority: 'routine',
            timing: '24 - 48 horas',
            fonte: 'AHA/ACC 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'AHA/ACC Categoria E1 ou E2: Choque cardiogênico evidente, hipotensão persistente ou parada cardiorrespiratória revertida',
      'AHA/ACC Categoria D1 ou D2: Falência cardiopulmonar incipiente, choque normotensivo com lactato elevado ou hipotensão transitória',
      'Pacientes submetidos a trombólise sistêmica, trombectomia por cateter ou embolectomia cirúrgica',
      'AHA/ACC Categoria C3 com instabilidade respiratória, necessidade de suporte de oxigênio em alto fluxo ou taquicardia desproporcional',
    ],
    references: [
      'AHA/ACC/CHEST/SCAI/SVM: Guideline for the Evaluation and Management of Acute Pulmonary Embolism in Adults, Feb 2026.',
      'ESC: Guidelines for the Diagnosis and Management of Acute Pulmonary Embolism Developed in Collaboration with the ERS, 2019.',
      'Jiménez D, et al. Simplification of the Pulmonary Embolism Severity Index (sPESI). Arch Intern Med 2010.',
      'Wells PS, et al. Derivation of a simple clinical model to categorize patients with suspected pulmonary embolism. Thromb Haemost 2000.',
    ],
  },

  // ---------------------------------------------------------------------------
  // FASE 3: PROTOCOLOS CARDIOVASCULARES
  // ---------------------------------------------------------------------------
  {
    id: 'pcr_adulto_pediatrica',
    title: 'Parada Cardiorrespiratória (Adulto e Pediátrica)',
    synonyms: ['PCR', 'Parada Cardíaca', 'Ressuscitação Cardiopulmonar', 'RCP', 'ACLS', 'PALS'],
    specialty: 'Cardiologia',
    cid10: ['I46.0', 'I46.9'],
    guidelines: [
      { nome: 'AHA Guidelines for CPR and Emergency Cardiovascular Care', sociedade: 'AHA', ano: 2025, status: 'CONFIRMADA' },
      { nome: 'ERC Guidelines for Resuscitation: Adult and Paediatric Life Support', sociedade: 'ERC', ano: 2025, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Compressões em < 10s do colapso; Desfibrilação em < 2 min no ritmo chocável',
    targetTimeWarning: 'A cada minuto sem compressões torácicas de alta qualidade ou desfibrilação, a sobrevida cai em 7% a 10%.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Cessação súbita e catastrófica da atividade mecânica cardíaca efetiva. O manejo segue as diretrizes AHA 2025 e ERC 2025, priorizando compressões ininterruptas de alta qualidade, desfibrilação precoce em ritmos chocáveis (FV/TV sem pulso), administração cronometrada de vasopressores/antiarrítmicos e rastreamento ativo de causas reversíveis (5H e 5T).',
    diagnosticCriteria: {
      symptoms: [
        'Vítima inconsciente / não responsiva a estímulo tátil e sonoro',
        'Ausência de respiração ou padrão de gasping agônico',
        'Ausência de pulso central palpável por mais de 10 segundos (carotídeo em adultos, braquial/femoral em lactentes)',
      ],
      mandatoryFindings: [
        'Monitorização imediata com monitor cardíaco ou pás do desfibrilador',
        'Identificação do ritmo de parada: Chocável (FV / TV sem pulso) vs Não chocável (AESP / Assistolia)',
        'Capnografia em onda (EtCO2 contínua): confirma intubação endotraqueal e monitora qualidade das compressões (EtCO2 > 10–20 mmHg)',
      ],
      redFlags: [
        'Pausas na compressão torácica superiores a 10 segundos',
        'Assistolia com onda reta em derivação única sem conferência do protocolo da linha reta (cabos, ganho e derivação)',
        'Hiperventilação excessiva (aumenta a pressão intratorácica e reduz o retorno venoso e débito cardíaco durante RCP)',
      ],
    },
    associatedScores: ['pcr_h_t'],
    scoresPlanejados: [],
    associatedDrugs: ['noradrenalina', 'dobutamina'],
    conductPhases: [
      {
        phaseTitle: 'Suporte Básico e Ritmo Inicial de Parada',
        timeWindow: '0 - 2 minutos',
        items: [
          {
            id: 'pcr-1',
            title: 'Compressões Torácicas de Alta Qualidade',
            detail:
              'Frequência de 100 a 120 compressões por minuto. Profundidade de 5 a 6 cm em adultos (1/3 do diâmetro AP em pediatria: ~4 cm em bebês e ~5 cm em crianças). Permitir o retorno completo do tórax após cada compressão. Minimizar pausas (< 10 segundos). Revezar socorrista a cada 2 minutos.',
            priority: 'emergency',
            timing: 'Imediato (< 10s)',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pcr-2',
            title: 'Desfibrilador e Checagem de Ritmo',
            detail:
              'Instalar pás ou eletrodos adesivos. Se Ritmo Chocável (FV / TV sem pulso): aplicar 1 choque imediatamente (Bifásico: 120–200 J; Pediátrico: 2 J/kg inicial). Reiniciar RCP imediatamente por 2 minutos sem checar pulso logo após o choque.',
            priority: 'emergency',
            timing: '< 2 min',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Suporte Avançado e Manejo Farmacológico (AHA 2025 / ERC 2025)',
        timeWindow: '2 - 10 minutos',
        items: [
          {
            id: 'pcr-3',
            title: 'Via Aérea Avançada e Monitorização de EtCO2',
            detail:
              'Intubação orotraqueal ou dispositivo supraglótico com confirmação mandatória por capnografia em onda. Após via aérea avançada instalada: compressões contínuas sem pausas para ventilação e 1 ventilação a cada 6 segundos (10 ventilações/min). Se EtCO2 < 10 mmHg persistente, otimizar compressões.',
            priority: 'emergency',
            timing: '2 - 5 min',
            fonte: 'AHA 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pcr-4',
            title: 'Vasopressor durante a RCP: Adrenalina (Epinefrina)',
            detail:
              'Adulto: Adrenalina 1 mg EV/IO a cada 3 a 5 minutos. Em ritmos NÃO chocáveis (AESP/Assistolia): administrar o mais rápido possível (logo no primeiro ciclo). Em ritmos chocáveis (FV/TV): administrar após o 2º choque. Pediátrico: 0,01 mg/kg EV/IO (0,1 mL/kg da solução 1:10.000, máx 1 mg).',
            priority: 'emergency',
            timing: 'A cada 3-5 min',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pcr-5',
            title: 'Antiarrítmico em FV / TV sem pulso refratária',
            detail:
              'Após o 3º choque desfibrilatório: Amiodarona 300 mg EV/IO em bólus rápido (segunda dose de 150 mg se FV/TV persistir no ciclo seguinte); OU Lidocaína 1 a 1,5 mg/kg EV/IO inicial (segunda dose 0,5 a 0,75 mg/kg). Pediátrico: Amiodarona 5 mg/kg (máx 300 mg) ou Lidocaína 1 mg/kg.',
            priority: 'emergency',
            timing: 'Após 3º choque',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pcr-6',
            title: 'Rastreamento Sistemático das Causas Reversíveis (5H e 5T)',
            detail:
              'Investigar e corrigir ativamente: Hipóxia, Hipovolemia, Hidrogênio (acidose), Hipo/Hipercalemia, Hipotermia; Tensão pneumotórax (descompressão torácica), Tamponamento pericárdico (POCUS/pericardiocentese), Toxinas (antídotos), Trombose pulmonar (alteplase de resgate) e Trombose coronária.',
            priority: 'emergency',
            timing: 'Durante todo o atendimento',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Cuidados Pós-Parada e Retorno da Circulação Espontânea (RCE)',
        timeWindow: 'Pós-RCE imediato',
        items: [
          {
            id: 'pcr-7',
            title: 'Metas Hemodinâmicas e Ventilatórias Pós-RCE',
            detail:
              'Meta de PAM ≥ 65 mmHg (titular noradrenalina em bomba de infusão se PAS < 90 mmHg). Ventilação: manter SpO2 92–98% (evitar hiperóxia tóxica com PaO2 excessiva) e normocapnia (PaCO2 35–45 mmHg / EtCO2 35–40 mmHg).',
            priority: 'high',
            timing: '< 30 min pós-RCE',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pcr-8',
            title: 'ECG de 12 derivações e CATE de Emergência',
            detail:
              'Realizar ECG de 12 derivações imediatamente após o RCE. Se supra de ST presente ou forte suspeita de SCA/choque cardiogênico: acionar coronariografia invasiva de emergência com angiografia coronária percutânea prioritária.',
            priority: 'emergency',
            timing: '< 10 min pós-RCE',
            fonte: 'AHA 2025 / ESC 2023',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pcr-9',
            title: 'Controle Direcionado de Temperatura (TTM)',
            detail:
              'Para pacientes comatosos após o RCE: manter Controle Direcionado de Temperatura entre 32°C e 36°C (ou prevenção estrita de febre < 37,5°C) por pelo menos 36 a 72 horas para neuroproteção intensiva.',
            priority: 'high',
            timing: 'Primeiras 72 horas',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Todos os pacientes com retorno da circulação espontânea (RCE) pós-PCR devem ser admitidos imediatamente em UTI/CTI',
      'Necessidade de ventilação mecânica invasiva e monitorização contínua de parâmetros hemodinâmicos e neurológicos',
      'Uso de drogas vasoativas para estabilização hemodinâmica pós-parada',
      'Protocolo de Controle Direcionado de Temperatura (TTM)',
    ],
    references: [
      'American Heart Association (AHA): 2025 Guidelines for Cardiopulmonary Resuscitation (CPR) and Emergency Cardiovascular Care, Oct 2025.',
      'European Resuscitation Council (ERC): 2025 Guidelines for Resuscitation, Oct 2025.',
      'International Liaison Committee on Resuscitation (ILCOR): Consensus on Science With Treatment Recommendations (CoSTR), 2025.',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'taquiarritmias',
    title: 'Taquiarritmias no Adulto',
    synonyms: ['Taquicardia', 'Arritmia Rápida', 'Fibrilação Atrial', 'Flutter Atrial', 'Taquicardia Supraventricular', 'TV'],
    specialty: 'Cardiologia',
    cid10: ['I47.1', 'I47.2', 'I48.0', 'I48.9'],
    guidelines: [
      { nome: 'ESC Guidelines for the Management of Atrial Fibrillation', sociedade: 'ESC', ano: 2024, status: 'CONFIRMADA' },
      { nome: 'AHA/ACC ACLS Guidelines: Tachycardia with a Pulse Algorithm', sociedade: 'AHA/ACC', ano: 2025, status: 'CONFIRMADA' },
      { nome: 'ERC Guidelines: Management of Peri-Arrest Arrhythmias', sociedade: 'ERC', ano: 2025, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Cardioversão imediata em < 5 min se instabilidade hemodinâmica',
    targetTimeWarning: 'Taquicardias com instabilidade e hipotensão podem degenerar rapidamente para fibrilação ventricular ou colapso circulatório.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Frequência cardíaca > 100 bpm (geralmente patológica se > 150 bpm). O algoritmo divide os pacientes pela presença de 5 sinais clássicos de instabilidade (hipotensão, sensório alterado, choque, dor torácica isquêmica, EAP). Pacientes instáveis requerem cardioversão elétrica imediata; pacientes estáveis são estratificados pela largura e regularidade do QRS.',
    diagnosticCriteria: {
      symptoms: [
        'Palpitações súbitas, taquicardia paroxística ou sensação de batimentos irregulares',
        'Tontura, pré-síncope ou síncope súbita',
        'Dispneia aguda ou piora funcional súbita',
        'Dor ou desconforto torácico em opressão',
      ],
      mandatoryFindings: [
        'ECG de 12 derivações imediato (se estável) ou monitor de desfibrilador',
        'Identificação da largura do QRS: Estreito (< 120 ms) vs Largo (≥ 120 ms)',
        'Identificação do ritmo: Regular vs Irregular',
        'Avaliação dos 5 sinais de instabilidade hemodinâmica',
      ],
      redFlags: [
        'Hipotensão (PAS < 90 mmHg / PAM < 65 mmHg) ou choque associado',
        'Edema agudo de pulmão desencadeado pela frequência ventricular rápida',
        'QRS largo irregular rápido com suspeita de FA pré-excitada (Wolff-Parkinson-White) — BLOQUEADORES DO NÓ AV SÃO CONTRAINDICADOS',
      ],
    },
    associatedScores: ['taqui_instabilidade'],
    scoresPlanejados: [],
    associatedDrugs: ['noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Estratificação Inicial de Instabilidade Hemodinâmica',
        timeWindow: '0 - 5 minutos',
        items: [
          {
            id: 'taq-1',
            title: 'Avaliação dos 5 Sinais de Instabilidade',
            detail:
              'Checar: Hipotensão / choque; Alteração aguda do nível de consciência; Desconforto torácico isquêmico; Edema agudo de pulmão. Se QUALQUER sinal presente -> PACIENTE INSTÁVEL: Cardioversão Elétrica Sincronizada imediata.',
            priority: 'emergency',
            timing: '< 5 min',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'taq-2',
            title: 'Cardioversão Elétrica Sincronizada (Paciente Instável)',
            detail:
              'Garantir sedação e analgesia rápida se o nível de consciência permitir (Midazolam 2 a 3 mg EV ou Etomidato 0,1 a 0,2 mg/kg + Fentanil 50 mcg). Ativar o modo SINCRONIZADO no desfibrilador. Energias bifásicas recomendadas: FA instável: 120–200 J; Flutter atrial ou TPSV: 50–100 J; TV monomórfica instável: 100 J. Se TV polimórfica: choque assincrônico (desfibrilação 200 J).',
            priority: 'emergency',
            timing: 'Imediato',
            fonte: 'AHA 2025 / ESC 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Manejo Farmacológico do Paciente Estável (por Morfologia do QRS)',
        timeWindow: '5 - 30 minutos',
        items: [
          {
            id: 'taq-3',
            title: 'QRS Estreito e Regular (TPSV / Taquicardia por Reentrada Nodal)',
            detail:
              '1ª linha: Manobra vagal modificada (REVERT: manobra de Valsalva por 15s seguida de elevação passiva de pernas a 45°). Se falha: Adenosina 6 mg EV em bólus ultra-rápido periférico com flush de 20 mL de SF. Se não reverter em 1 a 2 min: Adenosina 12 mg EV em bólus rápido.',
            priority: 'high',
            timing: '< 15 min',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'taq-4',
            title: 'QRS Estreito e Irregular (Fibrilação Atrial / Flutter com Condução Variável)',
            detail:
              'Controle de Frequência Cardíaca (meta inicial < 110 bpm em repouso): Betabloqueador EV (Metoprolol 2,5 a 5 mg EV em 2 min, repetindo a cada 5 min até 15 mg) OU Bloqueador de Canal de Cálcio (Diltiazem 0,25 mg/kg EV em 2 min). Se IC com FE reduzida: preferir betabloqueador ou Amiodarona/Digoxina.',
            priority: 'high',
            timing: '< 30 min',
            fonte: 'ESC 2024 (FA)',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'taq-5',
            title: 'QRS Largo e Regular (Taquicardia Ventricular Monomórfica Estável)',
            detail:
              'Considerar TV até prova em contrário. Fármaco de escolha: Amiodarona 150 mg EV infundida em 10 minutos (diluída em SG 5% 100 mL). Manutenção se revertida: 1 mg/min por 6 horas (360 mg) seguido de 0,5 mg/min por 18 horas (540 mg). Alternativas: Procainamida 20 a 50 mg/min até supressão ou Lidocaína 1 a 1,5 mg/kg.',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'taq-6',
            title: 'QRS Largo Irregular / Torsades de Pointes',
            detail:
              'Se TV polimórfica com QT prolongado (Torsades de Pointes): Sulfato de Magnésio 2 g EV em 10 a 15 minutos (em SG 5% 100 mL). Se suspeita de FA com via acessória (WPW / pré-excitação): CONTRAINDICADOS adenosina, betabloqueadores, diltiazem e digoxina (podem induzir FV); realizar cardioversão elétrica.',
            priority: 'emergency',
            timing: 'Imediato',
            fonte: 'AHA 2025 / ESC 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Taquiarritmias com necessidade de cardioversão elétrica de emergência',
      'Taquicardia ventricular sustentada (mesmo que tolerada hemodinamicamente)',
      'Infusão contínua de antiarrítmicos intravenosos (Amiodarona, Diltiazem)',
      'Fibrilação atrial de alta resposta ventricular com insuficiência cardíaca aguda',
    ],
    references: [
      'ESC: 2024 Guidelines for the management of atrial fibrillation developed in collaboration with EACTS, Aug 2024.',
      'AHA: 2025 American Heart Association Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care, Oct 2025.',
      'ERC: 2025 European Resuscitation Council Guidelines for Resuscitation: Peri-arrest arrhythmias, Oct 2025.',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'bradiarritmias',
    title: 'Bradiarritmias Sintomáticas no Adulto',
    synonyms: ['Bradicardia', 'BAV', 'Bloqueio Atrioventricular', 'Doença do Nó Sinusal', 'Bradicardia Sinusal'],
    specialty: 'Cardiologia',
    cid10: ['I44.0', 'I44.1', 'I44.2', 'I49.5'],
    guidelines: [
      { nome: 'AHA/ACC ACLS Guidelines: Bradycardia Algorithm', sociedade: 'AHA/ACC', ano: 2025, status: 'CONFIRMADA' },
      { nome: 'ERC Guidelines: Management of Peri-Arrest Arrhythmias - Bradycardia', sociedade: 'ERC', ano: 2025, status: 'CONFIRMADA' },
      { nome: 'ESC Guidelines on Cardiac Pacing and Cardiac Resynchronization Therapy', sociedade: 'ESC', ano: 2021, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Atropina e preparo de marca-passo em < 5 min se bradicardia instável',
    targetTimeWarning: 'Bradiarritmias graves com bloqueio infranodal podem colapsar subitamente em assistolia refratária.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Frequência cardíaca < 50 bpm associada a sintomas ou sinais de hipoperfusão sistêmica. O algoritmo preconiza avaliação imediata de estabilidade hemodinâmica, administração de atropina para bloqueios suprainodais e rápido acionamento de marca-passo transcutâneo ou infusão contínua de catecolaminas (adrenalina ou dopamina) para bloqueios avançados (BAV de 2º grau tipo II e BAV total).',
    diagnosticCriteria: {
      symptoms: [
        'Frequência cardíaca lenta (< 50 bpm)',
        'Tontura extrema, sensação de desmaio iminente ou síncope súbita (Adams-Stokes)',
        'Dispneia, fraqueza muscular aguda e fadiga aos mínimos esforços',
        'Confusão mental aguda por hipoperfusão cerebral',
      ],
      mandatoryFindings: [
        'ECG de 12 derivações contínuo e monitorização com pás adesivas instaladas',
        'Diferenciação do nível do bloqueio: Sinusal / BAV de 1º grau / BAV 2º grau Mobitz I (Wenckebach) vs BAV 2º grau Mobitz II / BAV de 3º grau (BAVT)',
        'Checagem dos 5 sinais de hipoperfusão (hipotensão, sensório alterado, choque, dor torácica, IC aguda)',
      ],
      redFlags: [
        'BAV de alto grau com QRS largo (bloqueio infranodal abaixo do feixe de His com ritmo de escape ventricular lento e instável)',
        'Pausas sinusais prolongadas superiores a 3 segundos',
        'Hipotensão persistente não responsiva à atropina',
      ],
    },
    associatedScores: [],
    scoresPlanejados: [],
    associatedDrugs: ['dobutamina', 'noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Avaliação de Gravidade e Manejo de 1ª Linha',
        timeWindow: '0 - 5 minutos',
        items: [
          {
            id: 'bra-1',
            title: 'Identificação de Sinais de Hipoperfusão',
            detail:
              'Verificar: Hipotensão (PAS < 90 mmHg / PAM < 65 mmHg), síncope, dor torácica isquêmica, alteração do estado mental ou edema pulmonar. Se o paciente for assintomático e estável: monitorar e investigar causas reversíveis (hipercalemia, medicações cronotrópicas negativas, hipotireoidismo). Se sintomático: intervir imediatamente.',
            priority: 'emergency',
            timing: '< 5 min',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'bra-2',
            title: 'Fármaco de 1ª Escolha: Atropina EV',
            detail:
              'Atropina 1 mg EV em bólus rápido a cada 3 a 5 minutos, até uma dose máxima acumulada de 3 mg. Nota importante: A atropina é muito eficaz em bradicardia sinusal e BAV Mobitz I, mas é tipicamente INEFICAZ em BAV de 2º grau tipo II e BAVT com QRS largo ou pacientes com transplante cardíaco denervado (não retardar marca-passo nesses casos).',
            priority: 'emergency',
            timing: 'Imediato',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Manejo de 2ª Linha: Marca-Passo e Infusões de Resgate',
        timeWindow: '5 - 30 minutos',
        items: [
          {
            id: 'bra-3',
            title: 'Marca-Passo Transcutâneo Imediato',
            detail:
              'Se refratário à atropina ou se bloqueio infranodal de alto grau: instalar eletrodos de marca-passo transcutâneo imediatamente. Ajustar frequência para 60 a 70 bpm e aumentar a corrente (mA) até obter captura elétrica evidente (espícula seguida de QRS alargado e onda T oposta) E conferir pulso mecânico correspondente (femoral). Garantir sedação e analgesia se paciente consciente.',
            priority: 'emergency',
            timing: '< 10 min',
            fonte: 'AHA 2025 / ERC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'bra-4',
            title: 'Infusão Contínua de Adrenalina ou Dopamina',
            detail:
              'Alternativa ou ponte enquanto prepara marca-passo: Adrenalina em infusão contínua: 2 a 10 mcg/min (titular até resposta clínica); OU Dopamina: 5 a 20 mcg/kg/min em bomba de infusão.',
            priority: 'high',
            timing: '< 15 min',
            fonte: 'AHA 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'bra-5',
            title: 'Marca-Passo Transvenoso de Urgência',
            detail:
              'Em BAV de alto grau sintomático persistente (Mobitz II ou BAV total): passagem de cabo-eletrodo de marca-passo transvenoso provisório sob punção venosa central (veia jugular interna direita ou femoral).',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'ESC 2021 / AHA 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Bradiarritmias sintomáticas com necessidade de uso de atropina ou drogas vasoativas',
      'Presença de BAV de 2º grau Mobitz II ou BAV total (BAVT)',
      'Pacientes em uso de marca-passo transcutâneo ou transvenoso provisório',
      'Instabilidade hemodinâmica ou síncope prévia',
    ],
    references: [
      'AHA: 2025 American Heart Association Guidelines for Cardiopulmonary Resuscitation and Emergency Cardiovascular Care: Bradycardia, Oct 2025.',
      'ERC: 2025 European Resuscitation Council Guidelines: Peri-arrest arrhythmias, Oct 2025.',
      'ESC: Guidelines on cardiac pacing and cardiac resynchronization therapy, 2021.',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'edema_agudo_pulmao',
    title: 'Edema Agudo de Pulmão (EAP Cardiogênico)',
    synonyms: ['EAP', 'Insuficiência Cardíaca Aguda', 'Congestão Pulmonar Aguda', 'EAP Hipertensivo'],
    specialty: 'Cardiologia',
    cid10: ['I50.1', 'J81'],
    guidelines: [
      { nome: 'ESC Guidelines for the Diagnosis and Treatment of Acute and Chronic Heart Failure', sociedade: 'ESC', ano: 2023, status: 'CONFIRMADA' },
      { nome: 'Diretriz Brasileira de Insuficiência Cardíaca Aguda', sociedade: 'SBC', ano: 2023, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'VNI e vasodilatador em < 15 min do diagnóstico',
    targetTimeWarning: 'A postergação da Ventilação Não-Invasiva e do vasodilatador triplica a necessidade de intubação endotraqueal de urgência.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Emergência clínica caracterizada por acúmulo súbito de transudato nos alvéolos pulmonares por elevação abrupta das pressões de enchimento ventricular esquerdo. O tratamento de escolha combina posicionamento sentado, Ventilação Não-Invasiva (VNI) precoce (CPAP/BiPAP), vasodilatadores parenterais em doses tituladas e diurético de alça intravenoso. Morfina de rotina é contraindicada pelas diretrizes atuais.',
    diagnosticCriteria: {
      symptoms: [
        'Dispneia de início abrupto com ortopneia grave e incapacidade de permanecer deitado',
        'Tosse com expectoração espumosa rosada / rósea',
        'Sensação iminente de asfixia e sudorese fria profusa',
        'Agitação psicomotora intensa decorrente de hipoxemia aguda',
      ],
      mandatoryFindings: [
        'Estertores crepitantes pulmonares bilaterais difusos estendendo-se além do terço médio pulmonar',
        'Hipoxemia grave (SpO2 < 90% em ar ambiente com dessaturação rápida)',
        'Sinais de congestão sistêmica: turgência jugular patológica a 45°, refluxo hepatojugular e B3',
        'Gasometria arterial revelando hipoxemia grave e acidose mista inicial',
      ],
      redFlags: [
        'Fadiga respiratória iminente, respiração paradoxal ou rebaixamento do nível de consciência',
        'Hipotensão arterial sistêmica associada (PAS < 90 mmHg define choque cardiogênico, onde vasodilatadores são contraindicados)',
        'EAP desencadeado por SCA com supra de ST (requer CATE imediato)',
      ],
    },
    associatedScores: [],
    scoresPlanejados: [],
    associatedDrugs: ['dobutamina', 'noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Medidas Imediatas e Suporte Ventilatório Precoce',
        timeWindow: '0 - 15 minutos',
        items: [
          {
            id: 'eap-1',
            title: 'Posicionamento e Monitorização Imediata',
            detail:
              'Manter o paciente rigorosamente sentado com as pernas pendentes (reduz o retorno venoso pré-carga). Monitorização multiparamétrica de oximetria, ECG contínuo e pressão arterial não invasiva a cada 3 a 5 minutos.',
            priority: 'emergency',
            timing: '< 5 min',
            fonte: 'ESC / SBC',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'eap-2',
            title: 'Ventilação Não-Invasiva (VNI) Precoce — CPAP ou BiPAP (Classe I)',
            detail:
              'Iniciar VNI imediatamente em pacientes com desconforto respiratório (FR > 25 irpm, SpO2 < 90%). CPAP com pressão contínua de 5 a 10 cmH2O (ou BiPAP com IPAP 10-15 e EPAP 5-8 cmH2O) com FiO2 titulada para SpO2 92–96%. A VNI reduz o trabalho respiratório, melhora a complacência e diminui drasticamente as taxas de intubação orotraqueal e mortalidade (Recomendação Classe I, Nível A).',
            priority: 'emergency',
            timing: '< 10 min',
            fonte: 'ESC Heart Failure Guidelines',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Terapêutica Farmacológica Hemodinâmica (conforme a Pressão Arterial)',
        timeWindow: '10 - 60 minutos',
        items: [
          {
            id: 'eap-3',
            title: 'Vasodilatador Parenteral Precoce (se PAS ≥ 110 mmHg)',
            detail:
              'Pilar fundamental do EAP hipertensivo. Nitroglicerina EV titulada: iniciar a 10 a 20 mcg/min e titular a cada 3 a 5 minutos até alívio dos sintomas ou PAS atingir 110–120 mmHg. Em crises hipertensivas graves refratárias: Nitroprussiato de Sódio EV (0,3 a 3 mcg/kg/min) em bomba de infusão com proteção contra fotodegradação. Alerta de segurança: CONTRAINDICADOS se PAS < 90 mmHg ou uso recente de inibidores da PDE-5 (sildenafil em 24h, tadalafil em 48h).',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: 'ESC / SBC',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'eap-4',
            title: 'Diurético de Alça: Furosemida EV',
            detail:
              'Furosemida 20 a 40 mg EV em bólus lento (em pacientes virgens de tratamento); ou dose equivalente a 1 a 2 vezes a dose oral diária habitual tomada em casa. Promove vasodilatação venosa precoce nos primeiros 15 minutos e diurese subsequente. Avaliar débito urinário e eletrólitos após 2 horas.',
            priority: 'high',
            timing: '< 20 min',
            fonte: 'ESC Heart Failure Guidelines',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'eap-5',
            title: 'O que NÃO Fazer: Morfina de Rotina Desaconselhada',
            detail:
              'As diretrizes da ESC e SBC trazem recomendação CONTRA o uso rotineiro de morfina no EAP. Ensaios clínicos demonstraram aumento significativo de necessidade de ventilação mecânica invasiva, admissão em UTI e mortalidade hospitalar em pacientes que receberam opioides rotineiramente.',
            priority: 'routine',
            timing: 'Aviso de Segurança',
            fonte: 'ESC Guidelines',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Persistência de hipoxemia grave ou necessidade de suporte ventilatório contínuo por VNI',
      'Necessidade de infusão contínua de vasodilatadores em bomba de infusão (Nitroglicerina ou Nitroprussiato)',
      'EAP associado a choque cardiogênico ou hipotensão (PAS < 90 mmHg)',
      'EAP desencadeado por Síndrome Coronariana Aguda',
    ],
    references: [
      'ESC: Guidelines for the diagnosis and treatment of acute and chronic heart failure, 2023.',
      'Sociedade Brasileira de Cardiologia: Diretriz Brasileira de Insuficiência Cardíaca Aguda, 2023.',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'emergencia_hipertensiva',
    title: 'Emergência Hipertensiva vs Hipertensão Grave',
    synonyms: ['Crise Hipertensiva', 'Hipertensão Severa', 'Encefalopatia Hipertensiva', 'Dissecção de Aorta'],
    specialty: 'Cardiologia',
    cid10: ['I10', 'I15.9', 'I67.4'],
    guidelines: [
      { nome: 'Diretriz Brasileira de Hipertensão Arterial – 2025', sociedade: 'SBC/SBN/SBH', ano: 2025, status: 'CONFIRMADA' },
      { nome: 'AHA/ACC Hypertension Guidelines: Hypertensive Crises', sociedade: 'AHA/ACC', ano: 2025, status: 'CONFIRMADA' },
      { nome: 'ESC Guidelines for the Management of Elevated Blood Pressure and Hypertension', sociedade: 'ESC', ano: 2024, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Redução de 20-25% da PAM na 1ª hora na emergência (ou metas específicas imediatas em dissecção/AVCi)',
    targetTimeWarning: 'Reduções pressóricas abruptas ou excessivas podem precipitar isquemia cerebral, coronariana ou renal irreversível.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'A Diretriz Brasileira de Hipertensão Arterial 2025 (SBC) estabelece a distinção obrigatória entre Emergência Hipertensiva (elevação acentuada da PA com lesão aguda de órgão-alvo em progressão, exigindo UTI e droga intravenosa titulada) e Hipertensão Grave / Crise Sem LOA (manejo exclusivamente ambulatorial com medicações orais, sem internação). Cada subtipo de emergência hipertensiva possui meta pressórica e fármaco de escolha específicos.',
    diagnosticCriteria: {
      symptoms: [
        'Elevação marcante da pressão arterial (geralmente PAS > 180 mmHg e/ou PAD > 120 mmHg)',
        'Sintomas de lesão de órgão-alvo (LOA): cefaleia intensa com vômitos, escotomas, confusão, déficits focais, dor torácica lancinante, dispneia súbita',
        'Presença de proteinúria/hematúria com oligúria aguda',
      ],
      mandatoryFindings: [
        'Avaliação sistemática dos órgãos-alvo: cérebro (exame neurológico), coração (ECG e troponina), aorta (angio-TC se dor típica), rins (creatinina/ureia/EAS) e fundo de olho (retinopatia com hemorragias/papiledema)',
        'Estratificação pelo escore de LOA Aguda',
        'Determinação da etiologia específica para definição da meta pressórica correta',
      ],
      redFlags: [
        'Dissecção aguda de aorta: dor dorsal lancinante associada a assimetria pressórica nos braços > 20 mmHg',
        'Uso inadvertido de nifedipino sublingual de ação curta (formalmente proscrito pelo alto risco de hipotensão severa e AVCi)',
        'Tentativa de normalização rápida da PA em AVC isquêmico agudo (risco de estender o infarto cerebral na área de penumbra isquêmica)',
      ],
    },
    associatedScores: ['emergencia_hipertensiva_loa'],
    scoresPlanejados: [],
    associatedDrugs: ['noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Diferenciação Obrigatória (SBC 2025): LOA Presente vs Ausente',
        timeWindow: '0 - 15 minutos',
        items: [
          {
            id: 'hip-1',
            title: 'Triagem Mandatória de Lesão Aguda de Órgão-Alvo (DBHA 2025)',
            detail:
              'Se LOA Aguda AUSENTE -> Hipertensão Grave (antiga Urgência Hipertensiva): NÃO admitir em UTI, NÃO prescrever drogas parenterais. Conduta: repouso em sala tranquila, anti-hipertensivo oral habitual ou captopril/clonidina oral, observação e alta com retorno ambulatorial em 24 a 72h. Se LOA Aguda PRESENTE -> Emergência Hipertensiva: internação imediata em UTI e tratamento parenteral.',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: 'Diretriz SBC 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Metas e Condutas Específicas por Cenário Clínico',
        timeWindow: 'Primeiras 2 a 24 horas',
        items: [
          {
            id: 'hip-2',
            title: 'Dissecção Aguda de Aorta (Emergência Extrema)',
            detail:
              'Meta pressórica e cronotrópica em 20 minutos: Reduzir PAS < 120 mmHg E Frequência Cardíaca < 60 bpm. Conduta: INICIAR BETABLOQUEADOR PRIMEIRO (Esmolol em BIC ou Labetalol EV) para diminuir a dP/dt e o estresse de cisalhamento da parede da aorta, e somente DEPOIS associar Nitroprussiato de Sódio se a PAS permanecer > 120 mmHg. Vasodilatador puro isolado é contraindicado pelo risco de taquicardia reflexa.',
            priority: 'emergency',
            timing: '< 20 min',
            fonte: 'DBHA 2025 / AHA 2025',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'hip-3',
            title: 'Acidente Vascular Cerebral Isquêmico (AVCi) Agudo',
            detail:
              'Se candidato a trombólise endovenosa: PA deve ser mantida < 185/110 mmHg antes da alteplase/tenecteplase e < 180/105 mmHg nas primeiras 24 horas (usar Labetalol ou Nicardipina). Se NÃO candidato a trombólise: NÃO tratar a hipertensão arterial a não ser que PAS > 220 mmHg ou PAD > 120 mmHg; se ultrapassar esse limite, reduzir no máximo 15% da PA nas primeiras 24 horas para preservar a perfusão da penumbra isquêmica.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'DBHA 2025 / AHA Stroke Guidelines',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'hip-4',
            title: 'Encefalopatia Hipertensiva e Emergências Gerais',
            detail:
              'Redução gradual da Pressão Arterial Média (PAM) em 20% a 25% na primeira hora com Nitroprussiato de Sódio titulado (0,3 a 2 mcg/kg/min). Nas 2 a 6 horas seguintes, atingir meta de ~160/100 mmHg se bem tolerado. Manter monitorização invasiva por linha arterial e vigiar toxicidade por tiocianato se infusão > 48h ou disfunção renal.',
            priority: 'high',
            timing: '1 - 6 horas',
            fonte: 'DBHA 2025 / SBC',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'hip-5',
            title: 'Crise Hipertensiva Gestacional: Pré-Eclâmpsia Grave e Eclâmpsia',
            detail:
              'Prevenção/Tratamento de convulsões: Sulfato de Magnésio (Esquema Pritchard ou Zuspan: ataque de 4 g EV em 20 min, seguido de manutenção de 1 a 2 g/h em bomba contínua). Controle pressórico de emergência: Hidralazina 5 mg EV em bólus (repetir a cada 20 min se necessário, máx 20 mg) ou Labetalol EV. Alvo: manter PAS entre 140–150 mmHg e PAD entre 90–100 mmHg (evitar hipoperfusão uteroplacentária).',
            priority: 'emergency',
            timing: '< 30 min',
            fonte: 'DBHA 2025 / FEBRASGO',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Todas as emergências hipertensivas comprovadas por lesão aguda de órgão-alvo',
      'Necessidade de infusão contínua de vasodilatadores parenterais titulados (Nitroprussiato, Nitroglicerina, Labetalol)',
      'Dissecção aguda de aorta, AVCi com trombólise ou EAP hipertensivo',
      'Necessidade de monitorização invasiva contínua da pressão arterial (linha arterial)',
    ],
    references: [
      'Sociedade Brasileira de Cardiologia (SBC): Diretriz Brasileira de Hipertensão Arterial – 2025, Arq Bras Cardiol 2025.',
      'AHA/ACC: 2025 Hypertension Guidelines for the Management of High Blood Pressure and Hypertensive Emergencies.',
      'ESC: 2024 Guidelines for the management of elevated blood pressure and hypertension.',
    ],
  },

  // ---------------------------------------------------------------------------
  // FASE 4: INFECÇÕES (HAP/VAP E PIELONEFRITE)
  // ---------------------------------------------------------------------------
  {
    id: 'hap_vap',
    title: 'Pneumonia Hospitalar e Associada à Ventilação Mecânica (HAP/VAP)',
    synonyms: ['HAP', 'VAP', 'PAVM', 'Pneumonia Nosocomial', 'Pneumonia Hospitalar'],
    specialty: 'Pneumologia',
    cid10: ['J15.9', 'J18.9', 'Y95'],
    guidelines: [
      { nome: 'ATS/IDSA Guidelines for the Management of Adults with HAP and VAP', sociedade: 'ATS/IDSA', ano: 2016, status: 'CONFIRMADA' },
      { nome: 'Surviving Sepsis Campaign: Adult Guidelines', sociedade: 'SCCM/ESICM', ano: 2026, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Antimicrobiano em < 1h se choque séptico; culturas respiratórias antes do início',
    targetTimeWarning: 'O atraso no início do esquema antimicrobiano adequado contra bacilos gram-negativos resistentes eleva a mortalidade em pacientes ventilados.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Pneumonia adquirida após > 48 horas de internação hospitalar (HAP) ou após > 48 horas de intubação endotraqueal (VAP). As diretrizes conjuntas ATS/IDSA enfatizam a estratificação de risco para patógenos multirresistentes (MDR) e MRSA, a coleta prévia mandatória de aspirado traqueal ou lavado broncoalveolar, a seleção empírica baseada no microbioma local e a duração curta de 7 dias de tratamento na maioria dos pacientes com boa resposta clínica.',
    diagnosticCriteria: {
      symptoms: [
        'Novo infiltrado pulmonar persistente ou progressivo em radiografia ou tomografia de tórax após 48h de admissão/intubação',
        'Febre (> 38°C) ou hipotermia inexplicada (< 36°C)',
        'Secreção traqueobrônquica purulenta ou aumento expressivo do volume das secreções',
        'Piora nas trocas gasosas com queda da relação PaO2/FiO2 e aumento da demanda ventilatória (PEEP ou FiO2)',
      ],
      mandatoryFindings: [
        'Coleta de espécime do trato respiratório inferior (Aspirado traqueal quantitativo ≥ 10^6 UFC/mL ou Lavado Broncoalveolar ≥ 10^4 UFC/mL) ANTES de introduzir ou trocar antibiótico',
        'Hemoculturas (dois pares de sítios venosos distintos)',
        'Avaliação de risco de sepse / choque séptico (NEWS2 ou SOFA)',
        'Painel laboratorial com leucograma, procalcitonina e creatinina sérica para ajuste posológico',
      ],
      redFlags: [
        'Choque séptico rapidamente progressivo exigindo vasopressores em doses crescentes',
        'Hipoxemia refratária com necessidade de manobra de prona ou bloqueio neuromuscular',
        'Falha terapêutica em 48 a 72 horas com persistência de febre e leucocitose (investigar empiema parapneumônico ou patógeno resistente não coberto)',
      ],
    },
    associatedScores: ['hap_vap_mdr_risk', 'news2'],
    scoresPlanejados: [],
    associatedDrugs: ['noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Diagnóstico Microbiológico e Triagem de Sepse',
        timeWindow: '0 - 1 hora',
        items: [
          {
            id: 'hap-1',
            title: 'Coleta de Culturas Respiratórias e Hemoculturas',
            detail:
              'Realizar coleta de aspirado traqueal quantitativo (ou lavado broncoalveolar) e dois pares de hemoculturas imediatamente. NUNCA retardar antibiótico no choque séptico se a coleta demorar mais de 45 minutos.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'ATS/IDSA / SSC 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'hap-2',
            title: 'Triagem de Risco para Multirresistência (MDR / MRSA)',
            detail:
              'Avaliar escore de risco MDR: uso prévio de antibiótico EV em 90 dias, choque séptico atual, internação ≥ 5 dias ou prevalência de MRSA > 20%. Se ausência de risco: monoterapia antipseudomonas; se risco presente: terapia combinada antipseudomonas + cobertura anti-MRSA.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'ATS/IDSA',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Esquema Antimicrobiano Empírico Estratificado',
        timeWindow: '1 - 24 horas',
        items: [
          {
            id: 'hap-3',
            title: 'Betalactâmico Antipseudomonas (Espinha Dorsal do Tratamento)',
            detail:
              'Opções com dose e ajuste por TFG: Piperacilina-Tazobactam 4,5 g EV a cada 6 horas (preferir infusão estendida de 3 a 4 horas para otimizar tempo acima da MIC); OU Cefepime 2 g EV a cada 8 horas (infusão estendida); OU Meropenem 1 g EV a cada 8 horas (se histórico de patógeno produtor de ESBL ou sepse grave).',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'ATS/IDSA / SSC 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'hap-4',
            title: 'Segundo Agente Antipseudomonas (se Alto Risco de MDR ou Choque)',
            detail:
              'Associar agente de classe não-betalactâmica: Amicacina 15 a 20 mg/kg EV em dose única diária (com monitorização renal estrita); OU Ciprofloxacino 400 mg EV a cada 8 horas; OU Levofloxacino 750 mg EV a cada 24 horas.',
            priority: 'high',
            timing: '< 2 horas',
            fonte: 'ATS/IDSA',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'hap-5',
            title: 'Cobertura Anti-MRSA (se Fatores de Risco ou Prevalência > 20%)',
            detail:
              'Vancomicina com dose de ataque ponderal de 20 a 35 mg/kg EV (máximo 2.000 a 3.000 mg em infusão lenta de 2 horas) com monitorização guiada por AUC24/MIC alvo de 400–600 mg·h/L (Consenso ASHP/IDSA 2020); OU Linezolida 600 mg EV a cada 12 horas (preferível se lesão renal aguda associada ou risco elevado de nefrotoxicidade).',
            priority: 'high',
            timing: '< 2 horas',
            fonte: 'ASHP/IDSA 2020 / ATS 2016',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Descalonamento Terapêutico e Duração do Tratamento',
        timeWindow: '48 horas - 7 dias',
        items: [
          {
            id: 'hap-6',
            title: 'Descalonamento Guiado por Antibiograma e Duração de 7 Dias',
            detail:
              'Com os resultados das culturas quantitativas em 48 a 72 horas: suspender o 2º agente antipseudomonas e suspender a vancomicina/linezolida se MRSA negativo. Diretriz forte da ATS/IDSA: a duração padrão recomendada para HAP/VAP é de apenas 7 dias em pacientes que apresentam melhora clínica e estabilização de parâmetros hemodinâmicos e ventilatórios.',
            priority: 'routine',
            timing: '48h - 7 dias',
            fonte: 'ATS/IDSA',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Todos os pacientes com pneumonia associada à ventilação mecânica (VAP) já se encontram em ambiente de UTI',
      'Pacientes com HAP desenvolvendo insuficiência respiratória aguda hipoxêmica ou necessidade de intubação',
      'Sinais de sepse grave, choque séptico ou disfunção orgânica aguda (NEWS2 ≥ 7 ou SOFA crescente)',
    ],
    references: [
      'Kalil AC, et al. Management of Adults With Hospital-acquired and Ventilator-associated Pneumonia: 2016 Clinical Practice Guidelines by the Infectious Diseases Society of America and the American Thoracic Society. Clin Infect Dis 2016.',
      'Rybak MJ, et al. Therapeutic monitoring of vancomycin for serious methicillin-resistant Staphylococcus aureus infections: A revised consensus guideline and review. Am J Health-Syst Pharm 2020.',
      'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock, 2026.',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'pielonefrite_aguda',
    title: 'Pielonefrite Aguda e Urosepse',
    synonyms: ['Pielonefrite', 'ITU Alta', 'Infecção Renal Aguda', 'ITU Sistêmica', 'Urosepse'],
    specialty: 'Emergência Clínica',
    cid10: ['N10', 'N39.0', 'A41.9'],
    guidelines: [
      { nome: 'EAU Guidelines on Urological Infections: Pyelonephritis and Urosepsis', sociedade: 'EAU', ano: 2026, status: 'CONFIRMADA' },
      { nome: 'IDSA Guidelines for the Treatment of Acute Uncomplicated Cystitis and Pyelonephritis', sociedade: 'IDSA', ano: 2011, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Antibiótico em < 1h se choque; Imagem imediata e descompressão de urgência se litíase obstrutiva',
    targetTimeWarning: 'A pielonefrite com obstrução litiásica evolui para choque séptico fulminante e óbito se não houver descompressão urológica imediata.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Infecção bacteriana aguda do parênquima renal e sistema coletor. A Diretriz da Associação Europeia de Urologia (EAU 2026) classifica a pielonefrite como ITU sistêmica, enfatizando a diferenciação entre casos não complicados (passíveis de manejo ambulatorial) e complicados/obstrutivos. A presença de cálculo ureteral obstrutivo associado à infecção constitui emergência urológica absoluta que exige descompressão de urgência.',
    diagnosticCriteria: {
      symptoms: [
        'Febre alta (> 38°C), calafrios e tremores intensos',
        'Dor em flanco uni ou bilateral, dor lombar e punho-percussão dolorosa (sinal de Giordano positivo)',
        'Sintomas urinários baixos associados (disúria, polaciúria, urgência miccional)',
        'Náuseas, vômitos e intolerância alimentar frequentes',
      ],
      mandatoryFindings: [
        'Sumário de urina (EAS/tipo 1) revelando piúria intensa, bacteriúria e leucocitúria',
        'Urocultura com antibiograma coletada antes de iniciar antimicrobiano',
        'Hemoculturas (dois pares) em todos os pacientes que necessitam de internação hospitalar',
        'Exame de imagem (USG renal ou TC de abdome sem contraste) mandatória se sepse, suspeita de litíase ou ausência de melhora após 48h',
      ],
      redFlags: [
        'Pielonefrite Obstrutiva: hidronefrose ou cálculo ureteral concomitante (EMERGÊNCIA UROLÓGICA ABSOLUTA)',
        'Sinais de choque séptico: hipotensão (PAS < 90 ou PAM < 65 mmHg) e oligúria',
        'Pielonefrite enfisematosa em pacientes diabéticos (gás no parênquima renal visualizado na TC)',
      ],
    },
    associatedScores: ['pielonefrite_gravidade', 'news2'],
    scoresPlanejados: [],
    associatedDrugs: ['noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Estratificação de Gravidade e Descarte de Obstrução',
        timeWindow: '0 - 1 hora',
        items: [
          {
            id: 'pielo-1',
            title: 'Triagem de Risco e Investigação de Obstrução Litiásica',
            detail:
              'Avaliar escore de gravidade de pielonefrite. Se suspeita de cálculo, dor em cólica prévia, rim único ou choque séptico: realizar Ultrassonografia de rins e vias urinárias de urgência ou Tomografia Computadorizada sem contraste.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'EAU 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pielo-2',
            title: 'Pielonefrite Obstrutiva: Descompressão Urológica de Emergência',
            detail:
              'ALERTA CRÍTICO DE VIDA: Se confirmada hidronefrose por cálculo ou estenose em paciente febril com infecção: ACIONAR UROLOGISTA IMEDIATAMENTE para descompressão mecânica de emergência via cateter duplo J retrógrado ou nefrostomia percutânea. Antibióticos isolados não penetram no sistema coletor ocluído e não controlam o choque séptico sem drenagem.',
            priority: 'emergency',
            timing: 'Imediato (< 2h)',
            fonte: 'EAU 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Antibioticoterapia Empírica e Ressuscitação Volêmica',
        timeWindow: '1 - 24 horas',
        items: [
          {
            id: 'pielo-3',
            title: 'Ressuscitação Volêmica Parenteral',
            detail:
              'A pielonefrite sistêmica cursa com desidratação expressiva por vômitos, febre e vasodilatação inflamatória. Iniciar expansão com cristaloide balanceado (Ringer Lactato ou SF 0,9%) com alíquotas de 500 a 1.000 mL guiadas por perfusão e débito urinário.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'SSC 2026 / EAU',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pielo-4',
            title: 'Antimicrobiano Parenteral para Pacientes Internados',
            detail:
              '1ª linha hospitalar: Ceftriaxona 1 a 2 g EV a cada 24 horas; OU se histórico de colonização/infecção por enterobactéria produtora de ESBL: Ertapenem 1 g EV a cada 24 horas; OU em urosepse grave/choque séptico: Piperacilina-Tazobactam 4,5 g EV a cada 8 horas (ou Meropenem 1 g EV 8/8h). Se resistência local a quinolonas < 10%: Ciprofloxacino 400 mg EV 12/12h.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'EAU 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'pielo-5',
            title: 'Regime Oral para Casos Leves Sem Alarme (Ambulatorial)',
            detail:
              'Apenas para pacientes jovens, não gestantes, tolerando via oral e com suporte domiciliar: Ciprofloxacino 500 mg VO a cada 12 horas por 7 dias (se taxa local de resistência < 10%); ou dose inicial parenteral de Ceftriaxona 1 g EV/IM seguida de cefalosporina oral ou sulfametoxazol-trimetoprima conforme antibiograma por 10 a 14 dias.',
            priority: 'routine',
            timing: 'Ambulatorial',
            fonte: 'EAU 2026 / IDSA',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Reavaliação em 48 a 72 Horas e Ajuste Terapêutico',
        timeWindow: '48 - 72 horas',
        items: [
          {
            id: 'pielo-6',
            title: 'Reavaliação da Febre e Antibiograma da Urocultura',
            detail:
              'A febre da pielonefrite tipicamente cede em até 48 a 72 horas do início do antibiótico eficaz. Se persistência de picos febris após 72h: solicitar Tomografia com contraste para descartar abscesso renal, abscesso perinéfrico ou necrose de papila. Ajustar o antibiótico para o espectro mais estreito conforme o resultado da urocultura.',
            priority: 'high',
            timing: '48 - 72 horas',
            fonte: 'EAU 2026',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Pielonefrite associada a choque séptico (necessidade de vasopressores)',
      'Insuficiência renal aguda com oligúria acentuada ou hipercalemia',
      'Pielonefrite obstrutiva com instabilidade hemodinâmica pós-descompressão',
      'Pielonefrite enfisematosa com disfunção de múltiplos órgãos',
    ],
    references: [
      'European Association of Urology (EAU): Guidelines on Urological Infections, 2026 Edition.',
      'Gupta K, et al. International Clinical Practice Guidelines for the Treatment of Acute Uncomplicated Cystitis and Pyelonephritis in Women: A 2010 Update by the IDSA and ESCMID. Clin Infect Dis 2011.',
      'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock, 2026.',
    ],
  },

  // ---------------------------------------------------------------------------
  // FASE 5: METABÓLICO (CAD/EHH E DISTÚRBIOS ÁCIDO-BASE / HIDROELETROLÍTICOS)
  // ---------------------------------------------------------------------------
  {
    id: 'emergencias_hiperglicemicas_cad_ehh',
    title: 'Emergências Hiperglicêmicas (CAD e EHH)',
    synonyms: ['CAD', 'EHH', 'Cetoacidose Diabética', 'Estado Hiperosmolar', 'Crise Hiperglicêmica'],
    specialty: 'Emergência Clínica',
    cid10: ['E10.1', 'E11.0', 'E11.1', 'E14.0'],
    guidelines: [
      { nome: 'Consensus Statement on Hyperglycemic Crises in Adults With Diabetes', sociedade: 'ADA/EASD', ano: 2024, status: 'CONFIRMADA' },
      { nome: 'Standards of Care in Diabetes: Glycemic Emergencies', sociedade: 'ADA', ano: 2026, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Ressuscitação volêmica imediata; Checar K+ antes de iniciar insulina',
    targetTimeWarning: 'NUNCA iniciar insulina se o potássio sérico for inferior a 3,5 mEq/L (risco iminente de arritmia letal por hipocalemia grave induzida pela insulina).',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Emergências metabólicas agudas decorrentes de deficiência absoluta ou relativa de insulina com elevação de hormônios contrarreguladores. A diretriz de consenso ADA/EASD 2024 unifica a abordagem de Cetoacidose Diabética (CAD) e Estado Hiperosmolar Hiperglicêmico (EHH), priorizando a dosagem direta de beta-hidroxibutirato, o uso de gasometria venosa (evitando punção arterial desnecessária), ressuscitação volêmica precoce, monitorização do potássio sérico antes da insulina e critérios padronizados de resolução clínica.',
    diagnosticCriteria: {
      symptoms: [
        'Poliúria acentuada, polidipsia e perda ponderal aguda',
        'Náuseas, vômitos incoercíveis e dor abdominal difusa (simulando abdome agudo na CAD)',
        'Hálito cetônico característico e respiração de Kussmaul (hiperpneia profunda e rápida)',
        'Sinais de desidratação grave: turgor pastoso, mucosas secas, hipotensão postural e taquicardia',
        'Alteração do estado mental: desde sonolência e confusão até torpor e coma profundo (especialmente no EHH)',
      ],
      mandatoryFindings: [
        'Glicemia sérica (frequentemente > 200–250 mg/dL na CAD; > 600 mg/dL no EHH)',
        'Gasometria venosa: pH venoso e bicarbonato sérico (HCO3-)',
        'Beta-hidroxibutirato sérico quantitativo (≥ 3,0 mmol/L confirma cetoacidose; padrão-ouro ADA 2024)',
        'Eletrólitos com cálculo obrigatório do Ânion Gap sérico e da Osmolalidade sérica efetiva',
        'Sódio corrigido pela glicemia: Na_corrigido = Na_medido + 0,016 × (Glicemia - 100)',
      ],
      redFlags: [
        'Potássio sérico < 3,5 mEq/L: CONTRAINDICAÇÃO TEMPORÁRIA DE INSULINA (repor potássio primeiro)',
        'Queda da glicemia > 75–100 mg/dL por hora (risco de edema cerebral por queda osmótica abrupta)',
        'Acidose metabólica persistente com ânion gap normal após melhora da CAD (acidose hiperclorêmica por excesso de NaCl 0,9% — conduta autolimitada que não requer prorrogação de insulina EV)',
      ],
    },
    associatedScores: ['cad_gravidade', 'ehh_criterios'],
    scoresPlanejados: [],
    associatedDrugs: ['noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Ressuscitação Volêmica e Checagem do Potássio',
        timeWindow: '0 - 1 hora',
        items: [
          {
            id: 'cad-1',
            title: 'Expansão Volêmica Imediata',
            detail:
              'Iniciar imediatamente infusão de cristaloide (Ringer Lactato ou SF 0,9%) a 1.000 mL/h na primeira hora em adultos (10 a 20 mL/kg). Avaliar estado hemodinâmico: se choque cardiogênico ou sobrecarga, titular com cautela; se desidratação grave sem choque, manter 250 a 500 mL/h nas 2 a 4 horas seguintes guiado pelo sódio corrigido.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'ADA/EASD 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'cad-2',
            title: 'Regra de Ouro do Potássio (K+) antes da Insulina',
            detail:
              'SE K+ < 3,5 mEq/L: NÃO INICIAR INSULINA! Administrar KCl 20 a 40 mEq/h em solução de infusão até que o potássio sérico ultrapasse 3,5 mEq/L. SE K+ entre 3,5 e 5,5 mEq/L: adicionar 20 a 30 mEq de KCl por litro de fluido para manter o K+ entre 4,0 e 5,0 mEq/L durante a infusão de insulina. SE K+ > 5,5 mEq/L: não adicionar potássio e iniciar insulina imediatamente, checando K+ a cada 2 horas.',
            priority: 'emergency',
            timing: '< 1 hora',
            fonte: 'ADA/EASD 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Insulinoterapia Contínua e Proteção contra Hipoglicemia',
        timeWindow: '1 - 24 horas',
        items: [
          {
            id: 'cad-3',
            title: 'Infusão Contínua de Insulina Regular',
            detail:
              'Após garantir K+ ≥ 3,5 mEq/L: iniciar Insulina Regular EV contínua em bomba de infusão a 0,1 U/kg/h (ou 0,14 U/kg/h sem bólus inicial prévio). Diluição padrão: 100 UI de Insulina Regular em 100 mL de SF 0,9% (concentração 1 UI/mL). Meta de redução glicêmica: 50 a 75 mg/dL por hora. Se a glicemia não cair pelo menos 50 mg/dL na 1ª hora, checar hidratação e aumentar a taxa de insulina em 50% a 100%.',
            priority: 'emergency',
            timing: '< 2 horas',
            fonte: 'ADA/EASD 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'cad-4',
            title: 'Adição de Glicose ao Esquema (Prevenção de Hipoglicemia e Edema Cerebral)',
            detail:
              'Quando a glicemia atingir 200 mg/dL na CAD (ou 250–300 mg/dL no EHH): ADICIONAR Solução Glicosada a 5% ou 10% aos fluidos de manutenção (ex.: SG 5% com NaCl 0,45%) e reduzir a taxa de insulina para 0,02 a 0,05 U/kg/h. NUNCA suspender a insulina enquanto os critérios de resolução da CAD não forem atingidos, pois a insulina é necessária para cessar a cetogênese.',
            priority: 'high',
            timing: 'Quando glicemia ~200 mg/dL',
            fonte: 'ADA/EASD 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Critérios de Resolução e Transição para Insulina Subcutânea',
        timeWindow: 'Resolução da crise',
        items: [
          {
            id: 'cad-5',
            title: 'Critérios Formais de Resolução (ADA/EASD 2024)',
            detail:
              'Resolução da CAD: Glicemia < 200 mg/dL E presença de pelo menos dois dos seguintes critérios: 1) Bicarbonato sérico ≥ 18 mEq/L; 2) pH venoso > 7,30; 3) Ânion gap normalizado (≤ 12 mEq/L); ou beta-hidroxibutirato sérico < 0,6 mmol/L. Resolução do EHH: Osmolalidade efetiva < 300 mOsm/kg, glicemia < 250 mg/dL, débito urinário adequado e retorno do nível de consciência basal.',
            priority: 'routine',
            timing: 'Avaliação horária/seriada',
            fonte: 'ADA/EASD 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'cad-6',
            title: 'Transição Segura para Insulina Subcutânea (Overlap)',
            detail:
              'Aplicar a primeira dose de insulina basal subcutânea (Glargina, Degludeca ou NPH) 2 a 4 horas ANTES de desligar a bomba de infusão de insulina intravenosa. Desligar a bomba sem sobreposição prévia de insulina basal causa cetoacidose rebote em 30 a 60 minutos.',
            priority: 'emergency',
            timing: 'No momento da transição',
            fonte: 'ADA/EASD 2024',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Cetoacidose diabética grave (pH < 7,00, bicarbonato < 10 mEq/L ou coma)',
      'Estado hiperosmolar hiperglicêmico com osmolalidade > 320 mOsm/kg e rebaixamento do sensório',
      'Instabilidade hemodinâmica, choque ou disfunção renal aguda anúrica associada',
      'Hipocalemia severa refratária com necessidade de infusão venosa central concentrada de potássio',
    ],
    references: [
      'Davies MJ, et al. Management of Hyperglycemic Crises in Adults With Diabetes: A Consensus Report by the American Diabetes Association (ADA) and European Association for the Study of Diabetes (EASD). Diabetes Care 2024.',
      'American Diabetes Association: Standards of Care in Diabetes — 2026.',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'disturbios_eletroliticos_acidobase',
    title: 'Distúrbios Eletrolíticos e Ácido-Base (Hipercalemia, Hiponatremia e Gasometria)',
    synonyms: ['Distúrbio Eletrolítico', 'Hipercalemia', 'Hiponatremia', 'Distúrbio Ácido-Base', 'Gasometria'],
    specialty: 'Emergência Clínica',
    cid10: ['E87.0', 'E87.1', 'E87.2', 'E87.5'],
    guidelines: [
      { nome: 'Clinical Practice Guideline: Management of Hyperkalaemia in Adults', sociedade: 'UK Kidney Association', ano: 2023, status: 'CONFIRMADA' },
      { nome: 'Clinical Practice Guideline on Diagnosis and Treatment of Hyponatraemia', sociedade: 'ESE/ESICM/ERA', ano: 2014, status: 'CONFIRMADA' },
    ],
    revisadoEm: REVISADO_EM,
    validacaoClinica: 'PENDENTE',
    targetTime: 'Gluconato de cálcio em < 5 min na hipercalemia grave; Bólus de NaCl 3% se hiponatremia convulsiva',
    targetTimeWarning: 'Correção de sódio > 10 mEq/L em 24 horas pode causar Síndrome de Desmielinização Osmótica irreversível e tetraplegia.',
    statusBadge: 'Alta Prioridade',
    severity: 'critical',
    summary:
      'Manejo de emergência dos principais desequilíbrios iônicos e do equilíbrio ácido-base. Na Hipercalemia grave (K+ ≥ 6,5 ou alterações no ECG), o pilar imediato é a estabilização de membrana com gluconato de cálcio, seguido por shift intracelular (insulina + glicose) e eliminação. Na Hiponatremia sintomática grave, preconiza-se salina hipertônica (NaCl a 3%) em bólus com teto estrito de segurança diário para prevenir mielinólise pontina central.',
    diagnosticCriteria: {
      symptoms: [
        'Hipercalemia: fraqueza muscular ascendente flácida, parestesias, palpitações e bradiarritmias graves',
        'Hiponatremia: cefaleia intensa, náuseas, vômitos, desorientação, marcha atáxica, convulsões e coma',
        'Distúrbios Ácido-Base: hiperpneia de Kussmaul (acidose metabólica) ou respiração superficial hipoventilatória (alcalose metabólica)',
      ],
      mandatoryFindings: [
        'ECG de 12 derivações imediato na suspeita de hipercalemia (pesquisar T apiculada, PR alargado, achatamento de P e alargamento de QRS)',
        'Gasometria venosa ou arterial com cálculo de Ânion Gap sérico e compensação respiratória esperada (fórmula de Winter: pCO2 = 1,5 × [HCO3-] + 8 ± 2)',
        'Eletrólitos séricos (Na+, K+, Cl-, Ca++, Mg++, P) e glicemia para cálculo do sódio corrigido e osmolalidade efetiva',
      ],
      redFlags: [
        'Hipercalemia com perda de onda P ou alargamento do QRS: ritmo sinoventricular com parada cardíaca iminente',
        'Hiponatremia crônica corrigida a uma velocidade > 10 mEq/L nas primeiras 24 horas (alto risco de desmielinização osmótica)',
        'Uso de bicarbonato de sódio em acidose lática sem ventilação adequada (gera CO2 tecidual e agrava acidose intracelular paradoxal)',
      ],
    },
    associatedScores: ['hipercalemia_severidade', 'hiponatremia_sintomas'],
    scoresPlanejados: [],
    associatedDrugs: ['noradrenalina'],
    conductPhases: [
      {
        phaseTitle: 'Manejo Imediato da Emergência Hipercalêmica (K+ ≥ 6,5 ou ECG alterado)',
        timeWindow: '0 - 30 minutos',
        items: [
          {
            id: 'eletro-1',
            title: '1º Passo: Estabilização de Membrana Miocárdica (Gluconato de Cálcio)',
            detail:
              'Gluconato de Cálcio a 10%: administrar 30 mL (3 ampolas) EV em 5 a 10 minutos (ou Cloreto de Cálcio 10% 10 mL se acesso central ou parada cardíaca). Início de ação em 1 a 3 minutos; duração de 30 a 60 minutos. Não reduz o potássio sérico; previne arritmias fatais e fibrilação ventricular. Repetir em 5 a 10 minutos se o traçado do ECG persistir alterado.',
            priority: 'emergency',
            timing: '< 5 min',
            fonte: 'UK Kidney Association 2023',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'eletro-2',
            title: '2º Passo: Shift Intracelular de Potássio (Insulina + Glicose)',
            detail:
              'Solução polarizante: Insulina Regular 10 UI em 50 g de Glicose (100 mL de Glicose a 50% ou 500 mL de Glicose a 10%) EV infundida em 15 a 30 minutos. Reduz o K+ em 0,6 a 1,0 mEq/L em 30 a 60 minutos. Adjuvante: Nebulização contínua com Salbutamol 10 a 20 mg em 4 mL de SF 0,9% em 10 minutos (efeito sinérgico via receptores beta-2). Monitorar glicemia a cada hora por 6 horas.',
            priority: 'emergency',
            timing: '< 15 min',
            fonte: 'UKKA 2023',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'eletro-3',
            title: '3º Passo: Eliminação Corporal e Terapia Renal Substitutiva',
            detail:
              'Se diurese preservada: Furosemida 40 a 80 mg EV em bólus. Quelação intestinal: Ciclossilicato de Zircônio Sódico (Lokelma) 10 g VO 3 vezes ao dia nas primeiras 48h. Se anúria, insuficiência renal dialítica ou hipercalemia refratária: acionar HEMODIÁLISE DE EMERGÊNCIA imediatamente.',
            priority: 'high',
            timing: '< 1 hora',
            fonte: 'UK Kidney Association 2023',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
      {
        phaseTitle: 'Manejo da Hiponatremia Grave e Proteção Neurológica',
        timeWindow: '0 - 24 horas',
        items: [
          {
            id: 'eletro-4',
            title: 'Hiponatremia com Sintomas Graves: Salina a 3% em Bólus',
            detail:
              'Em presença de convulsão, coma, estupor ou hipertensão intracraniana: administrar IMEDIATAMENTE 150 mL de Solução Fisiológica Hipertônica a 3% EV em 20 minutos. Repetir dosagem de sódio e reavaliar sintomas neurológicos. Se sintomas graves persistirem, repetir o bólus de 150 mL de NaCl 3% em 20 min até 2 vezes (total de até 3 bólus ou até atingir aumento de 5 mEq/L no Na+ sérico).',
            priority: 'emergency',
            timing: 'Imediato (< 20 min)',
            fonte: 'ESE/ESICM/ERA Guidelines',
            statusRecomendacao: 'CONFIRMADA',
          },
          {
            id: 'eletro-5',
            title: 'Teto Estrito de Segurança Diária (Prevenção de Desmielinização Osmótica)',
            detail:
              'ALERTA CRÍTICO: Não ultrapassar a elevação máxima de 10 mEq/L nas primeiras 24 horas (e limite de ≤ 8 mEq/L/dia em pacientes com alto risco: desnutrição, alcoolismo, cirrose hepática ou hipocalemia associada). Se ocorrer supercorreção acidental (> 10 mEq/L em 24h): suspender fluidos hipertônicos, administrar SG 5% EV e considerar desmopressina (DDAVP 1 a 2 mcg SC) para reverter a elevação rápida e proteger a mielina pontina.',
            priority: 'emergency',
            timing: 'Monitorização seriada em 24h',
            fonte: 'ESE/ERA Guidelines',
            statusRecomendacao: 'CONFIRMADA',
          },
        ],
      },
    ],
    icuAdmissionCriteria: [
      'Hipercalemia grave com alterações eletrocardiográficas ou necessidade de hemodiálise de emergência',
      'Hiponatremia sintomática grave tratada com salina hipertônica a 3% em bólus',
      'Distúrbios ácido-base graves com acidose metabólica profunda (pH < 7,10) ou choque associado',
    ],
    references: [
      'UK Kidney Association: Clinical Practice Guideline on Management of Hyperkalaemia in Adults, Oct 2023.',
      'Spasovski G, et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Eur J Endocrinol 2014.',
    ],
  },
];

