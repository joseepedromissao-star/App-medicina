/**
 * AuraMed - Checklist para o Revisor Médico e Itens a VERIFICAR
 *
 * Como ler os status (nada aqui é validação clínica final):
 *  - VERIFICADO_POR_TESTE      → a aritmética/regra de software tem teste automatizado (não prova que o conteúdo clínico está certo).
 *  - CORRIGIDO_AGUARDA_REVISAO → falha corrigida no código; o conteúdo clínico ainda precisa de revisão médica.
 *  - PENDENTE_REVISAO_MEDICA   → depende de decisão/conferência de médico ou farmacêutico.
 *  - ATENCAO_CRITICA           → risco conhecido AINDA NÃO resolvido; resolver antes de qualquer uso.
 *
 * Nenhum item deve ser marcado como validado sem a assinatura de um médico revisor.
 */

import type { AuditStatus, MedicalAuditItem } from '../types/clinical';

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  VERIFICADO_POR_TESTE: 'Verificado por teste automatizado',
  CORRIGIDO_AGUARDA_REVISAO: 'Corrigido — aguarda revisão médica',
  PENDENTE_REVISAO_MEDICA: 'Pendente de revisão médica',
  ATENCAO_CRITICA: 'Atenção crítica — resolver antes de usar',
  VERIFICADO_PELO_MOTOR: 'Obsoleto',
};

export const MEDICAL_AUDIT_CHECKLIST: MedicalAuditItem[] = [
  // ------------------------------ Fórmulas -----------------------------------
  {
    id: 'audit-ckd-epi',
    category: 'Fórmula Matemática',
    item: 'Equação CKD-EPI 2021 (sem variável racial)',
    guidelineReference: 'CKD-EPI 2021 (creatinina), adotada por KDIGO/NKF',
    status: 'VERIFICADO_POR_TESTE',
    notes: 'Constantes (κ, α, fator 1,012) e exponenciais conferidos contra cálculo manual em 4 casos de referência.',
    acaoNecessaria: 'Confirmar a edição vigente da guideline KDIGO a citar na interface.',
    testeAutomatizado: ['TFG - valores de referência'],
    arquivo: 'lib/tfg.ts',
  },
  {
    id: 'audit-cockcroft-weight',
    category: 'Fórmula Matemática',
    item: 'Convenção de peso no Cockcroft-Gault (real / ideal de Devine / ajustado)',
    guidelineReference: 'A definir pelo revisor (bula do fármaco ou protocolo institucional)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'A política automática usa peso real se abaixo do ideal, ajustado se > 130% do ideal e real nos demais casos. A nota anterior citava IMC > 30, que não existe no código, e uma fonte comercial; ambas foram removidas.',
    acaoNecessaria: 'Definir a convenção oficial (ou por fármaco) e citar a fonte. A política é configurável (real | ideal | ajustado).',
    testeAutomatizado: ['TFG - valores de referência (peso ajustado, política forçada)'],
    arquivo: 'lib/tfg.ts',
  },
  {
    id: 'audit-tfg-validation',
    category: 'Segurança do Software',
    item: 'Validação de entradas da TFG (idade 18–120, peso 30–300 kg, altura 120–230 cm, creatinina 0,2–20 mg/dL)',
    guidelineReference: 'Faixas de plausibilidade (detecção de erro de digitação, não metas clínicas)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes: 'Antes: creatinina 0 virava 0,1 em silêncio (TFG 190), criança recebia a equação adulta e NaN se propagava. Agora lança ClinicalInputError.',
    acaoNecessaria: 'Aprovar ou ajustar as faixas em lib/validation.ts.',
    testeAutomatizado: ['TFG - entradas inválidas são recusadas'],
    arquivo: 'lib/validation.ts, lib/tfg.ts',
  },
  {
    id: 'audit-tfg-reliability',
    category: 'Fórmula Matemática',
    item: 'Aviso de confiabilidade da TFG (creatinina instável, diálise, extremos de peso)',
    guidelineReference: 'KDIGO (conceito de estado estável)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Aviso exibido em toda estimativa. A faixa KDIGO aplicada ao Cockcroft-Gault foi renomeada para "faixa de função renal para dose", porque o valor é mL/min não indexado. Diálise gera alerta próprio na conduta.',
    acaoNecessaria: 'Revisar o texto do aviso e decidir se estimativas devem ser ocultadas em lesão renal aguda.',
    testeAutomatizado: ['TFG completa devolve ambas as estimativas e avisos'],
    arquivo: 'lib/tfg.ts',
  },

  // ------------------------------- Doses -------------------------------------
  {
    id: 'audit-infusion-formula',
    category: 'Dose de Fármaco',
    item: 'Conversão dimensional mcg/kg/min, mcg/min, UI/min e mg/h ↔ mL/h',
    guidelineReference: 'Análise dimensional (não depende de guideline); concentração vem da diluição escolhida',
    status: 'VERIFICADO_POR_TESTE',
    notes:
      'Valores de referência (noradrenalina 26,3 mL/h; vasopressina 9 mL/h) e ida e volta em grade de 75 combinações, com erro limitado à resolução de 0,1 mL/h da bomba.',
    acaoNecessaria: 'Conferir os exemplos de referência manualmente na primeira revisão.',
    testeAutomatizado: ['Infusão - valores de referência'],
    arquivo: 'lib/infusion.ts',
  },
  {
    id: 'audit-infusion-input-safety',
    category: 'Segurança do Software',
    item: 'Recusa de entradas inválidas na infusão (peso, concentração, dose, taxa)',
    guidelineReference: 'Segurança do paciente / prevenção de erro de medicação',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Antes: peso 0 era tratado como 1 kg (taxa de 0,4 mL/h), peso 7 (digitação de 70) calculava normalmente e concentração 0 gerava 4,2 milhões de mL/h. Agora lança ClinicalInputError; taxa > 999 mL/h é recusada.',
    acaoNecessaria: 'Aprovar a faixa de peso adulto (30–300 kg), o limite de bomba (999 mL/h) e o limiar de aviso (300 mL/h).',
    testeAutomatizado: ['Infusão - entradas inválidas são recusadas'],
    arquivo: 'lib/infusion.ts, lib/validation.ts',
  },
  {
    id: 'audit-preset-invariant',
    category: 'Dose de Fármaco',
    item: 'Concentração derivada de quantidade ÷ volume final (vasopressina corrigida)',
    guidelineReference: 'Rótulo/bula e diluição padrão da instituição',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'A vasopressina tinha massa de 0,4 "mg" (20 UI equivalem a cerca de 0,04 mg) e concentração declarada de 0,2 UI/mL em campo de mcg, divergentes entre si. Agora há quantidade com unidade (mg ou UI) e a concentração é calculada, sem duplicar o dado.',
    acaoNecessaria: 'Conferir cada diluição padrão com a farmácia, incluindo se o volume final inclui o volume do fármaco.',
    testeAutomatizado: ['Presets e registro - invariantes de dados'],
    arquivo: 'lib/infusion.ts, data/farmacos.ts',
  },
  {
    id: 'audit-nora-base-salt',
    category: 'Dose de Fármaco',
    item: 'Noradrenalina: "4 mg" refere-se à base ou ao sal (hemitartarato)?',
    guidelineReference: 'Bula da apresentação usada pela farmácia',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'A diluição de 4 mg em 250 mL (16 mcg/mL) só está correta se o "mg" for da base. Se for do sal, a concentração real da base é menor.',
    acaoNecessaria: 'Farmácia confirma a apresentação e define se a dose é expressa em base.',
    arquivo: 'lib/infusion.ts',
  },
  {
    id: 'audit-nora-extravasation',
    category: 'Dose de Fármaco',
    item: 'Extravasamento de noradrenalina: antídoto e acesso periférico',
    guidelineReference: 'ISMP Brasil / bula / protocolo institucional (a definir)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'A versão anterior afirmava fentolamina 5–10 mg e acesso periférico limitado a 2–4 h, sem fonte. Esses números foram retirados do texto; ficou a orientação geral e a marcação [a confirmar].',
    acaoNecessaria: 'Definir dose/diluição da fentolamina e o tempo máximo de acesso periférico, com fonte.',
    arquivo: 'lib/infusion.ts, data/farmacos.ts',
  },
  {
    id: 'audit-vasopressin-regime',
    category: 'Dose de Fármaco',
    item: 'Vasopressina: dose fixa de 0,03 UI/min e limite superior',
    guidelineReference: 'Surviving Sepsis Campaign 2026 (conferir no texto)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'A versão anterior dizia haver uma "trava" contra titulação acima de 0,04 UI/min; essa trava NÃO existia. Hoje o motor apenas sinaliza dose acima da faixa usual (severidade crítica + aviso), sem bloquear.',
    acaoNecessaria: 'Confirmar dose, faixa e se o limite deve ser bloqueio ou alerta.',
    testeAutomatizado: ['Infusão - valores de referência (vasopressina)'],
    arquivo: 'lib/infusion.ts',
  },
  {
    id: 'audit-nipride-antidote',
    category: 'Dose de Fármaco',
    item: 'Nitroprussiato: antídoto de cianeto no campo correto',
    guidelineReference: 'Bula / protocolo de intoxicação por cianeto',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes: 'Hidroxocobalamina e nitrito/tiossulfato estavam no campo extravasationAntidote; foram movidos para toxicityAntidote.',
    acaoNecessaria: 'Confirmar o esquema do antídoto e os limiares de toxicidade.',
    testeAutomatizado: ['Presets e registro - invariantes de dados'],
    arquivo: 'lib/infusion.ts',
  },
  {
    id: 'audit-dose-ranges',
    category: 'Dose de Fármaco',
    item: 'Faixas usuais, doses iniciais e passos de titulação de todos os presets',
    guidelineReference: 'A definir pelo revisor (guideline, bula ou protocolo institucional)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'Os valores vieram da Fase 0 sem fonte registrada. Todos os presets estão com validacaoClinica "PENDENTE" (um teste impede marcar como validado sem revisão).',
    acaoNecessaria: 'Preencher o campo fonte de cada preset/fármaco e mudar para VALIDADO apenas após conferência.',
    testeAutomatizado: ['Presets e registro - invariantes de dados'],
    arquivo: 'lib/infusion.ts, data/farmacos.ts',
  },
  {
    id: 'audit-enoxaparin-regime',
    category: 'Dose de Fármaco',
    item: 'Enoxaparina: regime por indicação e ajuste renal',
    guidelineReference: 'Guidelines de SCA/TEP e bula (a conferir)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'O motor calcula 1 mg/kg a cada 12 h e usa 24 h se ClCr (Cockcroft-Gault) < 30 mL/min. Faltam: regime por indicação (SCA, TEP, profilaxia), idade ≥ 75 anos, obesidade/limite de dose e a decisão de migrar para HNF (ClCr < 30 ou < 15?). Sangramento ativo bloqueia a prescrição.',
    acaoNecessaria: 'Definir regime por indicação, limiar de ajuste renal e regra de migração para HNF.',
    testeAutomatizado: ['Conduta - cálculo de doses (enoxaparina)', 'Conduta - segurança (sangramento ativo)'],
    arquivo: 'data/farmacos.ts, lib/conduta-engine.ts',
  },
  {
    id: 'audit-brand-names',
    category: 'Dose de Fármaco',
    item: 'Nomes comerciais brasileiros dos fármacos',
    guidelineReference: 'Bulário eletrônico ANVISA',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'Nomes comerciais de origem americana ou não conferidos foram removidos (brandNames vazio).',
    acaoNecessaria: 'Preencher com nomes conferidos no bulário.',
    arquivo: 'data/farmacos.ts',
  },

  // ----------------------- Estratificação de risco ---------------------------
  {
    id: 'audit-curb65-urea',
    category: 'Estratificação de Risco',
    item: 'CURB-65: ponto de corte e unidade da ureia',
    guidelineReference: 'ATS/IDSA 2019 e SBPT (conferir qual a instituição adota)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'scores.ts agora usa ureia > 42 mg/dL (> 7 mmol/L) no rótulo e na descrição, eliminando a inconsistência. A atribuição "padronizado BTS/SBPT" não foi confirmada: em materiais brasileiros costuma aparecer 50 mg/dL. Se a decisão foi do Gemini e não do preceptor, ela ainda precisa de validação.',
    acaoNecessaria: 'O preceptor confirma o ponto de corte único (42 ou 50 mg/dL) e a fonte, e o mesmo valor deve ser usado no CURB-65 e no critério de ureia do ATS/IDSA.',
    arquivo: 'data/scores.ts',
  },
  {
    id: 'audit-curb65-disposition',
    category: 'Estratificação de Risco',
    item: 'CURB-65 não define admissão em UTI',
    guidelineReference: 'ATS/IDSA 2019 (critérios maiores e menores de gravidade)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'A versão anterior do checklist dizia "3–5 = UTI". O CURB-65 apoia o local de tratamento; a gravidade para UTI usa os critérios ATS/IDSA (planejados em scoresPlanejados).',
    acaoNecessaria: 'Implementar PSI e critérios ATS/IDSA e ajustar a redação do CURB-65 em scores.ts.',
    arquivo: 'data/scores.ts, data/mock-protocols.ts',
  },
  {
    id: 'audit-qsofa-alone',
    category: 'Estratificação de Risco',
    item: 'Sepse: qSOFA como único score de triagem',
    guidelineReference: 'Surviving Sepsis Campaign 2026',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'O NEWS2 foi implementado e o qSOFA agora informa que resultado negativo não exclui sepse e que o NEWS2 é a triagem preferencial. Pendências: MEWS e SIRS ainda não existem em scores.ts, e as regras de interpretação do NEWS2 estão incompletas (ver audit-news2-rules).',
    acaoNecessaria: 'Implementar MEWS e SIRS e concluir as regras do NEWS2.',
    arquivo: 'data/scores.ts',
  },
  {
    id: 'audit-heart-score',
    category: 'Estratificação de Risco',
    item: 'Escore HEART: pontuação, população-alvo e troponina de alta sensibilidade',
    guidelineReference: 'ACC/AHA 2025 e ESC 2023 (conferir uso do HEART nas guidelines)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'A estrutura de pontuação foi conferida por leitura, mas não há teste automatizado. Aplicar apenas em dor torácica sem supra de ST; revisar os pontos de corte da troponina com ensaios de alta sensibilidade.',
    acaoNecessaria: 'Criar testes de pontuação e revisar a população-alvo e as faixas de risco com a fonte.',
    arquivo: 'data/scores.ts',
  },
  {
    id: 'audit-shock-index',
    category: 'Estratificação de Risco',
    item: 'Índice de choque (FC/PAS > 0,9) como alerta',
    guidelineReference: 'A definir pelo revisor',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'A fonte genérica anterior foi removida. O alerta já ressalva idosos e uso de betabloqueador.',
    acaoNecessaria: 'Definir a fonte e o ponto de corte.',
    arquivo: 'lib/conduta-engine.ts',
  },

  // --------------------- Alertas e textos da conduta -------------------------
  {
    id: 'audit-airway-glasgow',
    category: 'Tempo-Alvo',
    item: 'Alerta de via aérea com Glasgow ≤ 8',
    guidelineReference: 'A definir (ATLS e diretrizes de via aérea)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes: 'O texto "indicação formal de IOT" foi trocado por avaliar proteção de via aérea e investigar causas reversíveis (hipoglicemia, opioides, pós-ictal).',
    acaoNecessaria: 'Revisar o texto do alerta.',
    testeAutomatizado: ['Conduta - segurança (Glasgow ≤ 8)'],
    arquivo: 'lib/conduta-engine.ts',
  },
  {
    id: 'audit-map-alert',
    category: 'Tempo-Alvo',
    item: 'Alerta de PAM < 65 mmHg neutro quanto ao tipo de choque',
    guidelineReference: 'Protocolo de cada patologia',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes: 'Antes sugeria ressuscitação volêmica ou noradrenalina para qualquer paciente, o que pode prejudicar no choque cardiogênico ou hemorrágico. Agora orienta identificar o tipo de choque e seguir o protocolo.',
    acaoNecessaria: 'Revisar o texto; decidir se o alerta deve variar por condição.',
    testeAutomatizado: ['Conduta - segurança (PAM < 65)'],
    arquivo: 'lib/conduta-engine.ts',
  },
  {
    id: 'audit-contrast-alert',
    category: 'Conteúdo Clínico',
    item: 'Alerta de contraste iodado com TFG < 30',
    guidelineReference: 'A definir (consenso de contraste e função renal)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes: 'O texto "evitar contraste" foi trocado por ponderar risco-benefício sem adiar exame essencial.',
    acaoNecessaria: 'Confirmar o limiar de TFG e a fonte.',
    testeAutomatizado: ['Conduta - segurança (contraste)'],
    arquivo: 'lib/conduta-engine.ts',
  },
  {
    id: 'audit-conduct-blocking',
    category: 'Segurança do Software',
    item: 'Conduta bloqueada com dados inválidos; alertas de alergia, diálise, gestação, insuficiência hepática e sangramento',
    guidelineReference: 'Segurança do paciente',
    status: 'VERIFICADO_POR_TESTE',
    notes:
      'Peso inválido ou digitado errado bloqueia todos os cálculos (status DADOS_INVALIDOS) e nenhum fármaco sai com dose em branco. Os alertas só funcionam se os campos forem preenchidos; a verificação de reatividade cruzada de alergias NÃO é automática.',
    acaoNecessaria: 'Decidir se haverá mapa de classes de alérgenos (ex.: penicilinas/cefalosporinas).',
    testeAutomatizado: ['Conduta - segurança', 'Conduta - cálculo de doses'],
    arquivo: 'lib/conduta-engine.ts',
  },

  // ---------------------------- Conteúdo clínico -----------------------------
  {
    id: 'audit-sepsis-guideline',
    category: 'Conteúdo Clínico',
    item: 'Sepse: versão da guideline e meta de PAM',
    guidelineReference: 'Surviving Sepsis Campaign: Adult Guidelines 2026',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Atualizado de SSC 2021 para 2026. Meta de PAM: 65 mmHg, aceitando ±5; sugestão de 60–65 mmHg em ≥ 65 anos. As afirmações foram conferidas em fonte secundária; conferir no texto original. A estatística "7,6% por hora" foi retirada por não ter fonte oficial no protocolo; "SOFA ≥ 2" foi removido dos critérios de UTI (é critério de definição de sepse).',
    acaoNecessaria: 'Conferir o texto original da SSC 2026 nos itens marcados VERIFICAR.',
    arquivo: 'data/mock-protocols.ts, lib/infusion.ts',
  },
  {
    id: 'audit-sepsis-fluids',
    category: 'Conteúdo Clínico',
    item: 'Sepse: volume de cristaloide por kg e janela de tempo; cautela em cardiopatas',
    guidelineReference: 'SSC 2026 e diretrizes de insuficiência cardíaca',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'O volume foi retirado do texto até ser conferido. Definir a ressalva para fração de ejeção reduzida (alíquotas menores sob ultrassom pulmonar/VCI).',
    acaoNecessaria: 'Confirmar o volume e a janela no texto de 2026 e definir a ressalva para cardiopatas.',
    arquivo: 'data/mock-protocols.ts',
  },
  {
    id: 'audit-sepsis-timing',
    category: 'Tempo-Alvo',
    item: 'Sepse: janela de antimicrobiano (1 h) e limite de tempo para coleta de culturas',
    guidelineReference: 'SSC 2026',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'A regra dos 45 minutos de culturas vinha da edição de 2021 e foi marcada como VERIFICAR; a janela de 1 hora para choque e sepse provável/definida precisa ser conferida no texto.',
    acaoNecessaria: 'Conferir os tempos-alvo no texto de 2026.',
    arquivo: 'data/mock-protocols.ts',
  },
  {
    id: 'audit-sepsis-vasopressin-threshold',
    category: 'Conteúdo Clínico',
    item: 'Sepse: limiar de noradrenalina para associar vasopressina',
    guidelineReference: 'SSC 2026',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'A versão anterior fixava 0,25 mcg/kg/min; a guideline fala em adicionar vasopressina em vez de escalar a noradrenalina (faixa habitual 0,25–0,5). Texto ajustado e marcado VERIFICAR.',
    acaoNecessaria: 'Confirmar o limiar no texto de 2026.',
    arquivo: 'data/mock-protocols.ts',
  },
  {
    id: 'audit-nste-p2y12',
    category: 'Conteúdo Clínico',
    item: 'SCA sem supra: momento do inibidor de P2Y12 e dose do AAS',
    guidelineReference: 'ESC 2023; ACC/AHA 2025 (conferir)',
    status: 'ATENCAO_CRITICA',
    notes:
      'A versão anterior prescrevia dupla antiagregação imediata em todos os casos, o que conflita com a ESC 2023 (não recomenda pré-tratamento de rotina com P2Y12 quando se planeja estratégia invasiva precoce com anatomia desconhecida). Texto ajustado para condicional; as doses do AAS ficaram sem valor até serem conferidas.',
    acaoNecessaria: 'Definir a conduta de P2Y12 conforme a guideline adotada pelo serviço e preencher a dose do AAS com fonte.',
    arquivo: 'data/mock-protocols.ts',
  },
  {
    id: 'audit-pac-update',
    category: 'Conteúdo Clínico',
    item: 'PAC: incorporação da atualização ATS 2025',
    guidelineReference: 'ATS 2025 (atualização parcial) e ATS/IDSA 2019',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Incluídos: ultrassom pulmonar como alternativa diagnóstica, duração de 3 a 5 dias em PAC não grave estável (condicional) e regras de corticoide (forte contra em não grave; restrito à PAC grave internada), com alerta de controvérsia. Referências por autor foram trocadas por nomes das guidelines.',
    acaoNecessaria: 'Revisar o texto e acrescentar a diretriz brasileira vigente (SBPT/SBI).',
    arquivo: 'data/mock-protocols.ts',
  },
  {
    id: 'audit-pac-antimicrobials',
    category: 'Dose de Fármaco',
    item: 'PAC: antimicrobianos ainda não cadastrados no registro de fármacos',
    guidelineReference: 'ATS/IDSA 2019 e bula',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'Ceftriaxona, azitromicina, amoxicilina e levofloxacino não têm regime no registro; o motor devolve "NÃO CALCULADO" em vez de usar doses digitadas em texto.',
    acaoNecessaria: 'Cadastrar e validar na Fase 1, com ajuste renal e alerta de QT.',
    arquivo: 'data/farmacos.ts',
  },
  {
    id: 'audit-references-policy',
    category: 'Conteúdo Clínico',
    item: 'Política de referências: apenas guidelines oficiais',
    guidelineReference: 'Regra do projeto (prompt v2)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes: 'Referências por autor individual nos protocolos foram trocadas por nome, sociedade e ano da guideline. Ainda restam citações por autor em scores.ts e nos comentários do código antigo.',
    acaoNecessaria: 'Aplicar a mesma política em scores.ts.',
    arquivo: 'data/mock-protocols.ts, data/scores.ts',
  },

  // ---------------------------- Software e produto ---------------------------
  {
    id: 'audit-validation-flags',
    category: 'Segurança do Software',
    item: 'Nenhum dado clínico marcado como VALIDADO sem revisão humana',
    guidelineReference: 'Processo de validação clínica',
    status: 'VERIFICADO_POR_TESTE',
    notes: 'Teste automatizado falha se algum preset ou fármaco for marcado VALIDADO. A mudança para VALIDADO exige remover esse teste conscientemente, após revisão assinada.',
    acaoNecessaria: 'Definir quem assina e como a data de revisão é registrada.',
    testeAutomatizado: ['Presets e registro - invariantes de dados'],
    arquivo: 'data/farmacos.ts, lib/infusion.ts',
  },
  {
    id: 'audit-pwa-version',
    category: 'Segurança do Software',
    item: 'Atualização do PWA e versão do conteúdo clínico visível',
    guidelineReference: 'Segurança do software',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'registerType "prompt" já foi aplicado e a data de revisão aparece em cada protocolo. Porém o aviso de atualização é manual e o botão "Atualizar" não ativa o service worker em espera: o usuário pode continuar com doses antigas após recarregar (ver item audit-ui-pwa-update).',
    acaoNecessaria: 'Aplicar a configuração e confirmar que a versão aparece na interface.',
    arquivo: 'vite.config.ts',
  },
  {
    id: 'audit-privacy',
    category: 'Segurança do Software',
    item: 'Nenhum dado de paciente armazenado ou enviado (LGPD)',
    guidelineReference: 'LGPD',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'Os motores não persistem nada. Busca no código da interface (src/): sem localStorage, sessionStorage, cookies, fetch ou uso de @google/genai; o contexto do paciente fica só em memória. Restam dependências e configurações de IA sem uso (ver item audit-ui-gemini-remnants) e o texto copiado/impresso, que contém dados do paciente por decisão do usuário.',
    acaoNecessaria: 'Auditar os componentes de UI e o texto copiado para a área de transferência.',
    arquivo: 'componentes de UI',
  },
  {
    id: 'audit-regulatory',
    category: 'Segurança do Software',
    item: 'Enquadramento regulatório antes de divulgar o aplicativo',
    guidelineReference: 'Regulamentação da ANVISA sobre software como dispositivo médico',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'Software de apoio à decisão clínica pode exigir enquadramento regulatório conforme a finalidade declarada e o público. Não divulgar como ferramenta de uso clínico real antes dessa análise.',
    acaoNecessaria: 'Consultar assessoria regulatória e definir o texto de finalidade de uso.',
  },

  // ----------------- Achados da revisão da interface (src/) ------------------
  {
    id: 'audit-ui-reverse-calc',
    category: 'Dose de Fármaco',
    item: 'Cálculo reverso (mL/h → dose) da interface usa a fórmula de mcg/kg/min para TODOS os fármacos',
    guidelineReference: 'Análise dimensional',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Com vasopressina (9 mL/h, dose real 0,03 UI/min) a interface mostra 0 UI/min; com nitroglicerina (3 mL/h, dose real 10 mcg/min) mostra 0,143 mcg/min. Só a noradrenalina e a dobutamina saem corretas. O motor agora tem calculateDoseFromRate(preset, taxa, peso), testado para todos os presets.',
    acaoNecessaria: 'Testar no aparelho: vasopressina a 9 mL/h deve mostrar 0,03 UI/min e nitroglicerina a 3 mL/h, 10 mcg/min. Corrigido na 3ª versão do projeto (verificado por leitura do código).',
    testeAutomatizado: ['Infusão - cálculo reverso genérico (corrige a conversão da interface)'],
    arquivo: 'src/components/calculators/CalculatorSheet.tsx, lib/infusion.ts',
  },
  {
    id: 'audit-ui-score-incomplete',
    category: 'Estratificação de Risco',
    item: 'ScoreCard exibe resultado com critérios não respondidos',
    guidelineReference: 'Segurança do paciente (subtriagem)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Ao abrir, o CURB-65 já mostra "baixo risco" com a ureia nunca avaliada, e o HEART marca 0 pontos em todos os itens (a opção "0" aparece selecionada sem o usuário escolher). Critério não respondido deve aparecer como "não avaliado", e o resultado só como parcial ou final quando todos tiverem resposta explícita.',
    acaoNecessaria: 'Testar no aparelho: CURB-65 sem responder a ureia deve mostrar "Pontuação INCOMPLETA" e nenhuma estratificação. Corrigido na 3ª versão (verificado por leitura do código).',
    arquivo: 'src/components/scores/ScoreCard.tsx',
  },
  {
    id: 'audit-ui-score-prefill',
    category: 'Estratificação de Risco',
    item: 'Pré-preenchimento dos scores a partir do perfil do paciente',
    guidelineReference: 'Segurança do paciente',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Os valores pré-preenchidos não acompanham mudanças do perfil (o estado manual anterior prevalece sobre o novo), então um critério marcado pelo caso "choque" continua marcado ao carregar um paciente eutrófico. O preenchimento também não é identificado como automático, e usa GCS < 15 como substituto de "confusão", que não é equivalente.',
    acaoNecessaria: 'Testar no aparelho: trocar de caso de exemplo e conferir que as sugestões mudam sem sobrescrever respostas manuais. Corrigido na 3ª versão (verificado por leitura do código).',
    arquivo: 'src/components/scores/ScoreCard.tsx',
  },
  {
    id: 'audit-ui-default-patient',
    category: 'Segurança do Software',
    item: 'Paciente padrão pré-preenchido (65 anos, 70 kg, creatinina 1,0) gera doses e conduta ao abrir o app',
    guidelineReference: 'Prevenção de erro de medicação',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Um usuário que não preencher o perfil recebe taxas de infusão e conduta para um paciente fictício, sem aviso. Os casos de exemplo (choque, renal, idoso) também não são identificados como fictícios.',
    acaoNecessaria: 'Testar no aparelho o bloqueio de calculadoras e conduta sem confirmação. Resíduo: Home ("Paciente Ativo", PAM, TFG), página de protocolo ("Perfil: kg") e Navbar ainda exibem o paciente não confirmado.',
    arquivo: 'src/context/PatientContext.tsx, src/components/ui/PatientDrawer.tsx',
  },
  {
    id: 'audit-ui-validation-badge',
    category: 'Conteúdo Clínico',
    item: 'Selo verde "Validado" exibido para recomendações apenas CONFIRMADAS',
    guidelineReference: 'Processo de validação clínica',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'statusRecomendacao "CONFIRMADA" significa que a existência e os pontos-chave da guideline foram conferidos, não que um médico validou o conteúdo. A interface mostra "Validado — conteúdo e dosagens confirmadas por guideline médica", o que passa uma garantia que não existe. Só validacaoClinica "VALIDADO" (assinado por revisor) pode mostrar esse selo.',
    acaoNecessaria: 'Conferir os rótulos nas páginas de protocolo e de conduta. Corrigido na 3ª versão (verificado por leitura do código).',
    arquivo: 'src/components/ui/ResultBadge.tsx',
  },
  {
    id: 'audit-ui-pwa-update',
    category: 'Segurança do Software',
    item: 'Atualização do PWA: botão "Atualizar" não ativa o service worker em espera; "offline pronto" nunca aparece',
    guidelineReference: 'Segurança do software (doses desatualizadas)',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'Com registerType "prompt", a nova versão fica em espera até todas as abas fecharem; recarregar a página mantém o conteúdo antigo. O estado offlineReady nunca é definido, então o usuário não é avisado de que o app funciona offline.',
    acaoNecessaria: 'Testar no aparelho: instalar, ficar offline, publicar uma versão nova e atualizar. useRegisterSW aplicado (verificado por leitura do código).',
    arquivo: 'src/components/layout/PwaPrompt.tsx, vite.config.ts',
  },
  {
    id: 'audit-ui-gemini-remnants',
    category: 'Segurança do Software',
    item: 'Restos de configuração de IA no projeto (@google/genai, express, dotenv, GEMINI_API_KEY, metadata.json)',
    guidelineReference: 'Regra do projeto (prompt v2): sem IA em tempo de execução',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'O código não chama IA, mas package.json lista @google/genai, express e dotenv, .env.example declara GEMINI_API_KEY e metadata.json declara a capacidade MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API. O script "clean" ainda remove server.js.',
    acaoNecessaria: 'Remoção aplicada em package.json, metadata.json e .env.example; o arquivo de lock também não contém @google/genai, express nem dotenv.',
    arquivo: 'package.json, .env.example, metadata.json',
  },
  {
    id: 'audit-ui-render-effects',
    category: 'Segurança do Software',
    item: 'setState dentro de useMemo (CalculatorSheet)',
    guidelineReference: 'Boas práticas de React',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes: 'Os erros de TFG, infusão e cálculo reverso são gravados em estado dentro do useMemo, causando renderizações extras e avisos do React.',
    acaoNecessaria: 'Aplicado na 3ª versão (verificado por leitura do código); conferir ausência de avisos do React no console.',
    arquivo: 'src/components/calculators/CalculatorSheet.tsx',
  },
  {
    id: 'audit-ts-strict',
    category: 'Segurança do Software',
    item: 'tsconfig sem "strict": true e sem script de teste',
    guidelineReference: 'Qualidade de software',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'Sem modo estrito, erros de tipo (null/undefined) passam despercebidos. O package.json não tem o script "test" para o Vitest.',
    acaoNecessaria: 'Já aplicados: strict e script de teste. Rodar localmente npm run lint e npm test e corrigir o que o tsc apontar.',
    arquivo: 'tsconfig.json, package.json',
  },
  {
    id: 'audit-conduct-scores',
    category: 'Conteúdo Clínico',
    item: 'A conduta gerada não depende do resultado dos scores',
    guidelineReference: 'Prompt v2 (conduta após scores e calculadoras)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes: 'generateStratifiedConduct usa só o perfil do paciente e o protocolo; o resultado do CURB-65, por exemplo, não muda o local de tratamento sugerido nem a gravidade do esquema.',
    acaoNecessaria: 'Na Fase 1, passar os resultados dos scores ao motor e escolher o ramo da conduta (ambulatorial, enfermaria, UTI) por regra.',
    arquivo: 'lib/conduta-engine.ts, data/mock-protocols.ts',
  },

  // ------------- Achados da revisão da Fase 1 (PAC: scores e protocolo) -------------
  {
    id: 'audit-psi-age',
    category: 'Estratificação de Risco',
    item: 'PSI/PORT sem pontos de idade e sexo',
    guidelineReference: 'Pneumonia Severity Index (regra de Fine) — conferir na publicação original',
    status: 'ATENCAO_CRITICA',
    notes:
      'O PSI soma a idade em anos (homens) ou a idade menos 10 (mulheres) antes dos demais critérios. O escore gerado não tem esse componente: um homem de 85 anos sem outras alterações (PSI real 85, classe III) aparece com 0 ponto e "Baixo Risco, tratamento ambulatorial seguro". O teste existente só confere a estrutura (número de critérios e faixas), não a pontuação.',
    acaoNecessaria: 'Somar automaticamente os pontos demográficos a partir de idade e sexo do paciente confirmado (ou marcar o escore como incompleto sem paciente confirmado) e criar testes com valores de referência.',
    arquivo: 'data/scores.ts, src/components/scores/ScoreCard.tsx',
  },
  {
    id: 'audit-news2-rules',
    category: 'Estratificação de Risco',
    item: 'NEWS2: regra de parâmetro isolado e frequência de monitorização',
    guidelineReference: 'Royal College of Physicians, NEWS2 (2017) — conferir no documento',
    status: 'ATENCAO_CRITICA',
    notes:
      'As pontuações das 7 variáveis conferem com o NEWS2. Faltam: (1) pontuação 3 em um único parâmetro exige resposta urgente, mas o motor soma e classifica só por total, então um paciente só com PAS 85 aparece como "baixo risco, monitorização a cada 12 h"; (2) a faixa de 1 a 4 pontos exibe a frequência de 12 h, que é a de pontuação 0; (3) a Escala 2 de SpO2 (hipercapnia crônica) não existe e isso deve estar avisado.',
    acaoNecessaria: 'Implementar a regra do parâmetro isolado, separar as faixas 0 e 1–4 com as frequências corretas e avisar sobre a Escala 2.',
    arquivo: 'data/scores.ts, src/components/scores/ScoreCard.tsx',
  },
  {
    id: 'audit-ui-calc-fallback',
    category: 'Dose de Fármaco',
    item: 'Calculadora da página de PAC cai silenciosamente no preset de noradrenalina',
    guidelineReference: 'Segurança do paciente (erro de medicação)',
    status: 'ATENCAO_CRITICA',
    notes:
      'O protocolo de PAC passa "ceftriaxona" como fármaco da calculadora, mas não há preset com esse id; o seletor volta ao preset de noradrenalina. Uma página de pneumonia passa a oferecer uma calculadora de vasopressor.',
    acaoNecessaria: 'Sem preset para o fármaco, mostrar "Sem calculadora de dose validada para este fármaco" e não cair em outro preset.',
    arquivo: 'src/components/calculators/CalculatorSheet.tsx, src/pages/ProtocolPage.tsx',
  },
  {
    id: 'audit-pac-drugs-unregistered',
    category: 'Dose de Fármaco',
    item: 'Protocolo de PAC lista 4 antimicrobianos que não estão no registro',
    guidelineReference: 'ATS/IDSA 2019 e bula',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'associatedDrugs referencia ceftriaxona, azitromicina, amoxicilina e levofloxacino, mas data/farmacos.ts continua só com 4 fármacos (noradrenalina, dobutamina, vasopressina, enoxaparina). Não foi inventada nenhuma dose, o que está correto, mas os ids ficaram soltos.',
    acaoNecessaria: 'Manter associatedDrugs vazio até haver regime confirmado, ou cadastrar os fármacos com fonte e validação pendente.',
    arquivo: 'data/mock-protocols.ts, data/farmacos.ts',
  },
  {
    id: 'audit-scores-tests',
    category: 'Segurança do Software',
    item: 'Testes dos novos scores conferem só a estrutura, não a pontuação',
    guidelineReference: 'Qualidade de software',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'tests/pac-scores.test.ts verifica contagem de critérios e faixas, e por isso não detectou a ausência da idade no PSI nem as regras faltantes do NEWS2. Não existe função pura de soma e interpretação para testar: o cálculo fica dentro do ScoreCard.',
    acaoNecessaria: 'Extrair sumScore e interpretScore para lib/ e testar com casos clínicos de referência (PSI, NEWS2, CURB-65, ATS/IDSA).',
    arquivo: 'tests/pac-scores.test.ts',
  },
  {
    id: 'audit-scores-provenance',
    category: 'Conteúdo Clínico',
    item: 'Fontes e afirmações sem lastro nos novos scores e protocolo',
    guidelineReference: 'Regra do projeto: apenas guidelines oficiais, sem autores individuais',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'Os novos escores citam autores individuais (Fine, Metlay, Lim). O ATS/IDSA traz "mortalidade > 20% a 50%" sem fonte, e o CURB-65 diz "padronizado BTS/SBPT". Além disso, o item pac-1 do protocolo passou de VERIFICAR para CONFIRMADA sem decisão registrada do revisor.',
    acaoNecessaria: 'Trocar referências por nome da guideline, remover ou fundamentar as afirmações e devolver pac-1 para VERIFICAR até a assinatura do preceptor.',
    arquivo: 'data/scores.ts, data/mock-protocols.ts',
  },

  // --------- Achados da revisão das Fases 2 a 5 (geradas sem revisão intermediária) ---------
  {
    id: 'audit-phases-runahead',
    category: 'Conteúdo Clínico',
    item: 'Fases 2 a 5 geradas de uma vez, sem revisão: 10 protocolos novos e 14 escores novos',
    guidelineReference: 'Processo do projeto (uma fase por vez, com revisão antes de "continuar")',
    status: 'ATENCAO_CRITICA',
    notes:
      'O Gemini avançou do piloto de PAC até a página "Sobre" sem aguardar revisão. Entraram TEP, PCR, taquiarritmias, bradiarritmias, edema agudo de pulmão, emergência hipertensiva, HAP/VAP, pielonefrite, CAD/EHH e distúrbios hidroeletrolíticos. Nenhum desses conteúdos foi revisado por médico. Uma amostra de cerca de 30 doses de adulto (epinefrina, amiodarona, atropina, adenosina, alteplase, furosemida, nitroglicerina e outras) parecia coerente com referências habituais de suporte avançado de vida, mas não foi conferida contra as edições de 2025/2026.',
    acaoNecessaria: 'Revisão médica protocolo por protocolo, conferindo cada dose, ponto de corte e tempo-alvo com o texto da guideline antes de qualquer uso.',
    arquivo: 'data/mock-protocols.ts, data/scores.ts',
  },
  {
    id: 'audit-status-self-certified',
    category: 'Conteúdo Clínico',
    item: 'Recomendações auto-rotuladas como CONFIRMADA sem conferência',
    guidelineReference: 'Processo de validação clínica',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'O Gemini marcou 63 recomendações e 27 guidelines como CONFIRMADA, e a interface exibe "Guideline conferida" para elas. Ninguém conferiu. O patch 4 devolve para VERIFICAR 60 recomendações e 20 guidelines, mantendo CONFIRMADA apenas em 3 recomendações (triagem de sepse da SSC 2026, duração de 3 a 5 dias e regras de corticoide da ATS 2025) e em 7 guidelines cuja existência foi conferida em fonte secundária.',
    acaoNecessaria: 'O revisor muda cada item para CONFIRMADA somente após conferir o texto original.',
    arquivo: 'data/mock-protocols.ts',
  },
  {
    id: 'audit-engine-authored-dose',
    category: 'Dose de Fármaco',
    item: 'Dose digitada no texto do protocolo passava direto para a prescrição (ex.: alteplase "100 mg")',
    guidelineReference: 'Prompt v2: doses só do registro de fármacos',
    status: 'CORRIGIDO_AGUARDA_REVISAO',
    notes:
      'O motor só bloqueava fármacos fora do registro quando o campo de dose estava vazio. O protocolo de TEP trazia "100 mg" e "100 mg em 100 mL" digitados, que eram exibidos como prescrição calculada. Agora o motor ignora qualquer dose digitada e devolve "NÃO CALCULADO" para fármaco sem regime no registro.',
    acaoNecessaria: 'Cadastrar alteplase e demais fármacos no registro, com fonte e validação, antes de esperar que saiam calculados.',
    testeAutomatizado: ['Conduta - cálculo de doses (dose digitada é descartada)'],
    arquivo: 'lib/conduta-engine.ts',
  },
  {
    id: 'audit-drugs-text-only',
    category: 'Dose de Fármaco',
    item: 'Doses dos protocolos novos existem só em texto livre; o registro continua com 4 fármacos',
    guidelineReference: 'Prompt v2: doses centralizadas no registro, com fonte e status',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'Adrenalina, amiodarona, atropina, adenosina, alteplase, heparina não fracionada, insulina, potássio, solução salina a 3%, antimicrobianos e outros aparecem apenas dentro de textos de conduta, sem fonte por dose, sem ajuste renal e sem alerta de alta vigilância. Além disso, as páginas de alguns protocolos oferecem a calculadora de fármacos do registro (por exemplo, noradrenalina na página de CAD/EHH) mesmo sem relação com a terapia da patologia.',
    acaoNecessaria: 'Decidir quais fármacos entram no registro e quais ficam apenas como texto de referência, e restringir a calculadora de cada página aos fármacos pertinentes.',
    arquivo: 'data/mock-protocols.ts, data/farmacos.ts',
  },
  {
    id: 'audit-pediatric-scope',
    category: 'Segurança do Software',
    item: 'Protocolo de PCR inclui doses pediátricas, mas o software valida apenas adultos',
    guidelineReference: 'AHA 2025 e ERC 2025 (suporte avançado de vida pediátrico)',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'Os motores recusam idade < 18 anos e peso < 30 kg. As doses pediátricas (por exemplo, por kg e com dose máxima) existem só como texto e não têm calculadora, validação de peso pediátrico nem faixas de plausibilidade próprias.',
    acaoNecessaria: 'Decidir se o escopo é adulto, e então retirar o conteúdo pediátrico, ou criar um modo pediátrico com validação e testes próprios.',
    arquivo: 'data/mock-protocols.ts, lib/validation.ts',
  },
  {
    id: 'audit-phases-tests',
    category: 'Segurança do Software',
    item: 'Testes das Fases 1 a 5 (54 testes) verificam cadastro e estrutura, não a pontuação clínica',
    guidelineReference: 'Qualidade de software',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'Os testes conferem presença de escores, número de critérios e faixas de interpretação. Nenhum calcula uma pontuação a partir de respostas e confere o resultado, por isso não detectam erros como a falta de pontos de idade no PSI. Todos passam, o que transmite uma segurança que não existe.',
    acaoNecessaria: 'Criar funções puras de soma e interpretação e testes com casos clínicos de referência para cada escore.',
    arquivo: 'tests/*.test.ts',
  },
  {
    id: 'audit-docs-claims',
    category: 'Conteúdo Clínico',
    item: 'CHANGELOG-CLINICO.md e página "Sobre" afirmam fonte exclusiva em guidelines oficiais e rastreabilidade completa',
    guidelineReference: 'Honestidade sobre o estado de validação',
    status: 'PENDENTE_REVISAO_MEDICA',
    notes:
      'Os textos afirmam que o conteúdo se baseia "exclusivamente" nas diretrizes oficiais e descrevem a fonte como única e verificada. Enquanto o conteúdo estiver sem revisão médica, essas afirmações não podem ser feitas ao público.',
    acaoNecessaria: 'Reescrever como "em validação": conteúdo de rascunho, não revisado, não para uso clínico.',
    arquivo: 'CHANGELOG-CLINICO.md, src/pages/AboutPage.tsx',
  },
];

/** Contagem por status, útil para o painel do revisor. */
export function summarizeAudit(items: MedicalAuditItem[] = MEDICAL_AUDIT_CHECKLIST): Record<AuditStatus, number> {
  const base: Record<AuditStatus, number> = {
    VERIFICADO_POR_TESTE: 0,
    CORRIGIDO_AGUARDA_REVISAO: 0,
    PENDENTE_REVISAO_MEDICA: 0,
    ATENCAO_CRITICA: 0,
    VERIFICADO_PELO_MOTOR: 0,
  };
  items.forEach((i) => {
    base[i.status] += 1;
  });
  return base;
}
