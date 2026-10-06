# AuraMed — Suporte à Decisão em Emergência & UTI

Portal clínico premium de apoio à decisão em urgências e emergências médicas e terapia intensiva, com estratificação de risco, scores interativos, motores de dose ajustados por função renal e biometria, e conduta determinística estruturada.

---

## 1. Arquitetura e Estrutura de Pastas

```
├── data/
│   ├── farmacos.ts                   # Registro de fármacos com dados ISMP e diluições
│   ├── medical-audit-checklist.ts    # Checklist oficial de auditoria médica e itens a VERIFICAR
│   ├── mock-protocols.ts             # Protocolos clínicos de demonstração (9 seções)
│   └── scores.ts                     # Definições tipadas de escores estratificados (CURB-65, qSOFA, HEART)
├── lib/
│   ├── __tests__/
│   │   ├── clinical-engines.test.ts  # Suíte Vitest (invariantes, valores de referência, segurança)
│   │   └── clinical-engines_test.ts  # Testes de regressão clínica
│   ├── conduta-engine.ts             # Motor de conduta determinística baseada em regras
│   ├── infusion.ts                   # Motor de doses e conversões em BIC (mcg/kg/min, UI/min, mL/h)
│   ├── tfg.ts                        # Motor de TFG: CKD-EPI 2021 + Cockcroft-Gault + Devine/ABW
│   └── validation.ts                 # Camada de segurança clínica (ClinicalInputError)
├── src/
│   ├── components/
│   │   ├── calculators/              # Calculadoras laboratoriais e conversor de BIC
│   │   ├── conduta/                  # Painel de conduta clínica estratificada
│   │   ├── layout/                   # Navbar, CommandPalette, ReadingProgress, PwaPrompt
│   │   ├── scores/                   # ScoreCard interativo com feedback em tempo real
│   │   └── ui/                       # ResultBadge, AlertaAltaVigilancia, ComoCalculei, PatientDrawer
│   ├── context/
│   │   └── PatientContext.tsx        # Estado do paciente exclusivamente em memória (LGPD)
│   ├── pages/
│   │   ├── AuditPage.tsx             # Checklist de auditoria médica e governança clínica
│   │   ├── HomePage.tsx              # Portal com grade de patologias e ferramentas rápidas
│   │   ├── ProtocolPage.tsx          # Página da patologia em 9 seções obrigatórias
│   │   └── QuickToolsPage.tsx        # Calculadoras rápidas (TFG & Infusão)
│   ├── App.tsx                       # Componente raiz com navegação e controle de tema
│   ├── index.css                     # Design tokens Tailwind v4 e fontes
│   └── main.tsx                      # Ponto de entrada React
├── types/
│   └── clinical.ts                   # Schemas tipados de dados clínicos
├── public/                           # Manifest e ícones PWA (192px, 512px, maskable, apple-touch-icon)
├── vite.config.ts                    # Vite + VitePWA (registerType: 'prompt')
└── metadata.json                     # Metadados do aplicativo
```

---

## 2. Validação Clínica

### 2.1 Fonte Única de Verdade e Governança
- **Guidelines Oficiais**: Todas as doses, metas e limiares derivam estritamente de diretrizes de sociedades médicas oficiais (Surviving Sepsis Campaign 2026, ATS 2025, ATS/IDSA 2019, ACC/AHA, ESC, SBC, KDIGO, ISMP Brasil).
- **Sem IA em Tempo de Execução**: As condutas e prescrições são geradas por motores de cálculo **determinísticos** em TypeScript puro. Nenhuma dose é inferida ou gerada por modelo de linguagem.
- **Selo de Validação**: Todo protocolo ou fármaco cuja revisão ainda esteja pendente exibe a etiqueta visual **"Pendente de validação"**. Recomendações que exigem conferência no texto original são marcadas como `statusRecomendacao: 'VERIFICAR'`.

### 2.2 Camada de Segurança Posológica
1. **Recusa de Entradas Inválidas**: Entradas fora das faixas biológicas de plausibilidade (ex.: peso 7 kg digitado por engano em vez de 70 kg, ou creatinina 0) lançam `ClinicalInputError`. O motor **nunca** corrige uma entrada em silêncio.
2. **Medicamentos de Alta Vigilância (ISMP Brasil)**: Vasoativos, inotrópicos e anticoagulantes apresentam faixa destacada de conferência por 2 profissionais, exibição da dose máxima e orientação de conduta em extravasamento/toxicidade.
3. **Concentrações Derivadas**: A concentração de cada solução é estritamente calculada a partir de `massa ÷ volume final`, eliminando inconsistências entre a bolsa e o cálculo da bomba.
4. **Proteção de Dados do Paciente (LGPD)**: Todos os cálculos rodam exclusivamente em memória volátil do navegador (`PatientContext`). Não há gravação em `localStorage`, cookies ou telemetria em rede.

---

## 3. Checklist de Itens a VERIFICAR pelo Revisor Médico

Abaixo estão os itens assinalados com `ATENCAO_CRITICA` ou `PENDENTE_REVISAO_MEDICA` que demandam validação do médico revisor:

### Atenção Crítica (resolver antes de uso clínico):
1. **CURB-65**: Definição de ponto de corte e unidade da ureia sérica (> 50 mg/dL de ureia vs. BUN > 19 mg/dL / > 7 mmol/L).
2. **Sepse — qSOFA isolado**: Adição dos escores de alerta precoce recomendados pela SSC 2026 (NEWS2, MEWS ou SIRS), pois qSOFA negativo não exclui sepse.
3. **SCA sem Supra — Dupla Antiagregação (P2Y12)**: Ajuste quanto ao pré-tratamento de rotina com inibidor de P2Y12 em estratégia invasiva precoce conforme ESC 2023 e ACC/AHA 2025.

### Pendente de Revisão Médica:
4. **Cockcroft-Gault**: Convenção institucional de peso (peso real vs. peso ideal de Devine vs. peso ajustado em pacientes obesos).
5. **Noradrenalina**: Definição se a apresentação da farmácia refere-se à base ou ao sal hemitartarato.
6. **Extravasamento de Noradrenalina**: Dose/diluição da fentolamina infiltrada e protocolo institucional de tempo máximo de acesso venoso periférico transitório.
7. **Vasopressina**: Dose fixa recomendada pela SSC 2026 (0,03 UI/min) e limites de segurança.
8. **Enoxaparina**: Regimes por indicação (SCA vs. TEP vs. Profilaxia), limiares de ajuste renal e transição para HNF.
9. **Sepse — Ressuscitação Volêmica**: Volume de cristaloides balanceados por kg e critérios de responsividade a volume.
10. **Sepse — Culturas e Tempo de Início de Antimicrobiano**: Janela de 1 hora para sepse provável/choque e coleta de hemoculturas.

---

## 4. Design System & Recursos

- **Tipografia**: Títulos em serifa (*Newsreader*), corpo em *Plus Jakarta Sans*, números em mono (*JetBrains Mono*).
- **Interface**: Cantos arredondados `2xl`, vidro fosco (*glassmorphism*), Command Palette (`Ctrl/⌘+K`), barra de progresso de leitura, tema claro/escuro nativo.
- **PWA Offline**: Service Worker configurado via `vite-plugin-pwa` com `registerType: 'prompt'`, tela de atualização de versão do conteúdo clínico e ícones em conformidade com o padrão Web App Manifest.
