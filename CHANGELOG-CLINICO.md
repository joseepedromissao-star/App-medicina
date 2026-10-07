# CHANGELOG CLÍNICO — AuraMed

**Portal de Apoio à Decisão em Urgências e Emergências**  
*Registro oficial de evidências, fontes primárias de guidelines, decisões clínicas e rastreabilidade de regras.*

---

## 1. Princípios de Segurança Clínica e Governança

1. **Fonte Única de Verdade**:
   - **Conteúdo em validação: rascunho não revisado, não use para decisões clínicas**. As propostas de decisões clínicas, pontos de corte de escores, doses e tempos-alvo têm como meta diretrizes oficiais de sociedades médicas de referência internacional e nacional (AHA, ERC, ESC, ATS, IDSA, EAU, ADA, EASD, SCCM, ESICM, SBC, SBPT), dependendo de revisão médica formal antes de qualquer uso.
   - Proibida a citação de livros-texto desatualizados, autores individuais, blogs ou portais de notícias.
2. **Separação Rígida entre Lógica e Interface**:
   - Nenhum dado clínico vive disperso dentro de componentes React. Os parâmetros residem em schemas tipados e versionados (`data/scores.ts`, `data/mock-protocols.ts`, `data/farmacos.ts`).
3. **Privacidade e LGPD**:
   - **Zero transmissão de dados clínicos**: 100% dos cálculos rodam em memória no navegador do usuário. Nenhum dado do paciente é armazenado em disco, banco de dados ou `localStorage`.
4. **Camada de Alta Vigilância (ISMP Brasil)**:
   - Todo fármaco classificado como potencialmente perigoso (vasopressores, inotrópicos, insulina, heparina, soluções hipertônicas, potássio concentrado, antiarrítmicos) exige dupla checagem obrigatória de 2 profissionais antes da infusão e exibe o teto de segurança da dose máxima.
5. **Transparência de Rastreabilidade**:
   - Cada calculadora e estratificação possui rastreabilidade passo a passo (*"Como calculei"*), explicitando fórmula, substituição de variáveis e guideline sustentadora.

---

## 2. Registro Histórico de Fases e Patologias

### Fase 1: Pneumonia Adquirida na Comunidade (PAC)
- **Guideline Principal**: ATS 2025 (atualização parcial) + ATS/IDSA 2019 + Diretrizes Brasileiras SBPT/SBI.
- **Escores Implementados**:
  - `curb_65`: Ponto de corte único de ureia > 42 mg/dL (BUN > 19 mg/dL / > 7 mmol/L).
  - `psi_port`: 20 variáveis clínicas, laboratoriais e radiográficas estratificadas em Classes I a V (Fine et al.).
  - `ats_idsa_pac_grave`: Critérios de PAC grave (1 critério maior — choque ou ventilação mecânica invasiva — ou ≥ 3 critérios menores), definindo admissão direta em UTI.
- **Decisões Terapêuticas**:
  - Duração de 3 a 5 dias para pacientes estáveis com PAC não grave.
  - Forte recomendação contra corticoterapia sistêmica de rotina em PAC não grave internada.
  - Alerta de prolongamento de intervalo QTc para macrolídeos (azitromicina) e quinolonas respiratórias (levofloxacino).

### Fase 2: Tromboembolismo Pulmonar Agudo (TEP) e Choque Séptico
- **TEP**:
  - **Guideline**: AHA/ACC/CHEST/SCAI/SVM Guideline for the Evaluation and Management of Acute Pulmonary Embolism in Adults (fevereiro/2026) + ESC 2019.
  - **Escores**:
    - `aha_acc_2026_tep`: Categorias Clínicas A até E2. Categorias A-B (manejo ambulatorial); C (internação com ativação de time PERT — Classe 1); D (UTI com HNF contínua); E (UTI com terapias de reperfusão avançada / alteplase).
    - `wells_tep`: Dicotômico (≤ 4: improvável / indicação de D-dímero; > 4: provável / indicação direta de Angio-TC).
    - `spesi`: 0 ponto (baixo risco, 1,0% mortalidade); ≥ 1 ponto (alto risco, 10,9% mortalidade em 30 dias).
  - **Anticoagulação**: Preferência Classe 1 por HBPM (enoxaparina) sobre HNF em pacientes não candidatos à reperfusão com clearance preservado.
- **Sepse e Choque Séptico**:
  - **Guideline**: Surviving Sepsis Campaign (SSC 2026) e Sepsis-3.
  - **Escore**: `news2` preferencial na triagem inicial (qSOFA desaconselhado como ferramenta isolada de triagem).
  - **Metas**: PAM de 65 mmHg (faixa clínica ± 5 mmHg; permissivo 60–65 mmHg em ≥ 65 anos).
  - **Vasopressores**: Noradrenalina como 1ª linha; Vasopressina como 2º vasopressor; Adrenalina como adjuvante.

### Fase 3: Bloco Cardiovascular
- **Parada Cardiorrespiratória (PCR)**:
  - **Guidelines**: AHA Guidelines for CPR and ECC 2025 (publicada em 22/10/2025) e ERC 2025.
  - **Score**: `pcr_h_t` (Checklist de 10 causas reversíveis — 5H e 5T).
  - **Decisões**: Compressões 100–120/min, 5–6 cm; Choque bifásico 120–200 J (pediátrico 2 J/kg inicial, 4 J/kg subsequentes, máx 10 J/kg); Adrenalina 1 mg a cada 3–5 min; Amiodarona 300 mg / 150 mg; Metas pós-RCE (PAM ≥ 65, SpO2 92–98%, TTM 32–36°C).
- **Síndrome Coronariana Aguda (SCA / IAM)**:
  - **Guidelines**: ACC/AHA SCA 2025 e ESC ACS 2023.
  - **Escores**: `heart_score`, `timi_sca` (0-2 baixo, 3-4 intermediário, 5-7 alto risco) e `grace_score` (corte > 140 para CATE em < 24h).
  - **Reperfusão**: Porta-balão < 90 min (transferência < 120 min) para ICP primária; Fibrinólise (Tenecteplase por peso em bólus) se tempo porta-balão > 120 min.
- **Taquiarritmias**:
  - **Guidelines**: ESC 2024 (FA) e AHA/ERC 2025.
  - **Score**: `taqui_instabilidade` (5 sinais clássicos).
  - **Decisões**: Se instável -> Cardioversão sincronizada imediata. Se estável: manobra de Valsalva modificada + Adenosina 6 mg → 12 mg para QRS estreito regular; Betabloqueador/Diltiazem para FA; Amiodarona 150 mg EV em 10 min para TV monomórfica com pulso.
- **Bradiarritmias**:
  - **Guidelines**: AHA 2025 e ERC 2025.
  - **Decisões**: Atropina 1 mg a cada 3–5 min (máx 3 mg); Marca-passo transcutâneo imediato e infusão de catecolaminas em bloqueios infranodais (Mobitz II e BAVT).
- **Edema Agudo de Pulmão (EAP)**:
  - **Guidelines**: ESC Heart Failure 2023 e SBC 2023.
  - **Decisões**: VNI precoce (CPAP 5–10 cmH2O / BiPAP — Classe I, Nível A), Vasodilatador parenteral se PAS ≥ 110 mmHg (Nitroglicerina ou Nitroprussiato), Furosemida EV. Recomendação formal contra o uso de morfina de rotina.
- **Emergência Hipertensiva vs Hipertensão Grave**:
  - **Guidelines**: Diretriz Brasileira de Hipertensão Arterial 2025 (SBC/SBN/SBH) e AHA 2025.
  - **Score**: `emergencia_hipertensiva_loa` (Triagem de lesão aguda de órgão-alvo).
  - **Nomenclatura Obrigatória**: Hipertensão Grave sem LOA (antiga Urgência) = manejo ambulatorial/oral; NÃO prescrever vasodilatador EV. Emergência Hipertensiva = internação em UTI + vasodilatador parenteral titulado.
  - **Metas Específicas**: Dissecção aguda de aorta (PAS < 120 mmHg e FC < 60 bpm em 20 min com betabloqueador antes de nitroprussiato); AVCi (reduzir só se > 220/120 ou < 185/110 para trombólise).

### Fase 4: Infecções Graves
- **HAP / VAP (Pneumonia Hospitalar e Associada à Ventilação)**:
  - **Guidelines**: ATS/IDSA 2016 e Surviving Sepsis Campaign 2026.
  - **Score**: `hap_vap_mdr_risk` (abx 90d, choque, SDRA, internação ≥ 5d, diálise, MRSA > 20%).
  - **Decisões**: Monoterapia para baixo risco vs Terapia combinada (duplo antipseudomonas + vancomicina/linezolida) para alto risco. Coleta prévia de aspirado traqueal/LBA. Duração padrão de 7 dias com melhora clínica.
- **Pielonefrite Aguda e Urosepse**:
  - **Guidelines**: EAU Guidelines on Urological Infections 2026 e IDSA.
  - **Score**: `pielonefrite_gravidade` (urosepse, obstrução, rim único, DM/imunossupressão, gestação, intolerância oral).
  - **Alerta de Emergência**: Pielonefrite obstrutiva por cálculo exige descompressão urológica imediata (cateter duplo J ou nefrostomia percutânea). Esquema hospitalar de 1ª linha com Ceftriaxona 1 a 2 g EV a cada 24h.

### Fase 5: Metabólico
- **Emergências Hiperglicêmicas (CAD e EHH)**:
  - **Guidelines**: Consenso Internacional ADA/EASD 2024 e ADA Standards of Care 2026.
  - **Escores**: `cad_gravidade` (pH, bicarbonato, sensório, ânion gap) e `ehh_criterios` (glicemia > 600, osmolalidade > 320, ausência de cetoacidose).
  - **Regra de Ouro**: K⁺ < 3,5 mEq/L bloqueia o início da insulina até reposição de potássio.
  - **Conduta**: Insulina Regular 0,1 U/kg/h em BIC; Adição de SG a 5% aos fluidos quando glicemia atingir 200 mg/dL para prevenir hipoglicemia e edema cerebral sem suspender a insulina.
  - **Resolução**: Glicemia < 200 mg/dL + 2 critérios (HCO3 ≥ 18, pH > 7,30, ânion gap ≤ 12 ou beta-OHB < 0,6). Sobreposição de insulina basal 2 a 4h antes de desligar a bomba.
- **Distúrbios Eletrolíticos e Ácido-Base**:
  - **Guidelines**: UK Kidney Association 2023 e ESE/ESICM/ERA Guidelines de Hiponatremia.
  - **Escores**: `hipercalemia_severidade` e `hiponatremia_sintomas`.
  - **Hipercalemia**: Gluconato de Cálcio 10% 30 mL EV em 5–10 min (estabilização miocárdica imediata); Solução polarizante (Insulina 10 UI em Glicose 50 g EV); Salbutamol inalatório; Furosemida, Lokelma ou hemodiálise de emergência.
  - **Hiponatremia**: Bólus de 150 mL de NaCl 3% em 20 min para sintomas neurológicos graves (convulsão/coma). Limite estrito de correção ≤ 10 mEq/L em 24h (≤ 8 mEq/L/dia em alto risco) para prevenção de Síndrome de Desmielinização Osmótica.

---

## 3. Tabela Consolidada de Itens com Status `VERIFICAR`

Os seguintes parâmetros foram marcados com a etiqueta explícita de auditoria clínica `VERIFICAR` e exigem validação da rotina/farmácia clínica pelo médico revisor:

| Patologia | Parâmetro Clínico | Guideline Alvo | Status | Observação para o Revisor Médico |
|---|---|---|---|---|
| **TEP** | Dose rápida de Alteplase em colapso peri-parada | AHA/ACC 2026 | VERIFICAR | Conferir regime acelerado (50 mg bólus) vs infusão de 100 mg em 2h |
| **Sepse** | Dose máxima de Vasopressina | SSC 2026 | VERIFICAR | Confirmar teto de 0,03 UI/min vs titulação máxima até 0,04 UI/min |
| **SCA** | Momento de inibidor P2Y12 em SCASST | ACC/AHA 2025 / ESC 2023 | VERIFICAR | ESC desaconselha pré-tratamento antes do CATE; ACC/AHA individualiza |
| **PCR** | Doses pediátricas de choque pós-4 J/kg | PALS 2025 | VERIFICAR | Choques subsequentes até 10 J/kg ou dose máxima do adulto |
| **EAP** | Limite de infusão de Nitroprussiato | ESC / SBC | VERIFICAR | Alerta de tiocianato para infusões superiores a 48h com ClCr < 30 |
| **HAP/VAP** | Infusão estendida de Piperacilina-Tazo | ATS/IDSA 2016 | VERIFICAR | Confirmar padronização hospitalar de 3,375 g vs 4,5 g em 3 a 4 horas |
| **Pielonefrite** | Resistência local a Ciprofloxacino | EAU 2026 | VERIFICAR | Ponto de corte local de resistência de E. coli (< 10% para terapia oral) |
| **CAD** | Bicarbonato em pH < 6,90 | ADA/EASD 2024 | VERIFICAR | ADA mantém uso condicional apenas em acidose com risco iminente de colapso |
| **Hiponatremia** | Preparo artesanal de NaCl 3% | ESE / ERA | VERIFICAR | Confirmar se o serviço dispõe de bolsa pronta ou manipulação na farmácia |

---

## 4. Auditoria de Motores Matemáticos e Algoritmos

- **TFG CKD-EPI 2021 (sem raça)**: Fórmula oficial recomendada pela KDIGO e Sociedade Brasileira de Nefrologia.
- **Clearance Cockcroft-Gault**: Calcula com peso real, peso ideal (Devine) e peso ajustado para obesos (IMC ≥ 30).
- **Conversão de Infusão**: Cálculo reverso e direto validado (`mcg/kg/min` ↔ `mL/h`) com fórmula derivada estritamente de `(massa / volume)`.
- **Validação de Entradas**: Faixas biológicas plausíveis com bloqueio de cálculo se campos obrigatórios estiverem fora da faixa ou se o paciente não estiver formalmente confirmado pelo médico.

---
*Documento gerado automaticamente pelo pipeline clínico da Fase 6 do AuraMed. Atualizado em 06/10/2026.*
