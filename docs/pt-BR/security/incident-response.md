---
read_when:
    - Respondendo a um relatório de segurança ou a uma suspeita de incidente de segurança
    - Preparando uma divulgação coordenada ou uma versão de segurança corrigida
    - Revisando as expectativas de acompanhamento pós-incidente
summary: Como o OpenClaw faz a triagem, responde e acompanha incidentes de segurança
title: Resposta a incidentes
x-i18n:
    generated_at: "2026-05-06T09:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Detecção e triagem

Monitoramos sinais de segurança de:

- Avisos de Segurança do GitHub (GHSA) e relatórios privados de vulnerabilidade.
- Issues/discussões públicas do GitHub quando os relatórios não são sensíveis.
- Sinais automatizados (por exemplo, Dependabot, CodeQL, avisos do npm e varredura de segredos).

Triagem inicial:

1. Confirme o componente afetado, a versão e o impacto no limite de confiança.
2. Classifique como issue de segurança versus fortalecimento/nenhuma ação usando o escopo e as regras fora de escopo do `SECURITY.md` do repositório.
3. Um responsável pelo incidente responde adequadamente.

## 2. Avaliação

Guia de severidade:

- **Crítico:** Comprometimento de pacote/lançamento/repositório, exploração ativa ou desvio não autenticado do limite de confiança com controle de alto impacto ou exposição de dados.
- **Alto:** Desvio verificado do limite de confiança que exige pré-condições limitadas (por exemplo, ação autenticada, mas não autorizada, de alto impacto) ou exposição de credenciais sensíveis pertencentes ao OpenClaw.
- **Médio:** Fragilidade de segurança significativa com impacto prático, mas com explorabilidade restrita ou pré-requisitos substanciais.
- **Baixo:** Descobertas de defesa em profundidade, negação de serviço de escopo restrito ou lacunas de fortalecimento/paridade sem desvio demonstrado do limite de confiança.

## 3. Resposta

1. Confirme o recebimento ao relator (em privado quando for sensível).
2. Reproduza em lançamentos compatíveis e no `main` mais recente; depois implemente e valide um patch com cobertura de regressão.
3. Para incidentes críticos/altos, prepare lançamento(s) corrigido(s) o mais rápido possível na prática.
4. Para incidentes médios/baixos, aplique o patch no fluxo normal de lançamento e documente orientações de mitigação.

## 4. Comunicação

Comunicamos por meio de:

- Avisos de Segurança do GitHub no repositório afetado.
- Notas de lançamento/entradas de changelog para versões corrigidas.
- Acompanhamento direto com o relator sobre status e resolução.

Política de divulgação:

- Incidentes críticos/altos devem receber divulgação coordenada, com emissão de CVE quando apropriado.
- Descobertas de fortalecimento de baixo risco podem ser documentadas em notas de lançamento ou avisos sem CVE, dependendo do impacto e da exposição dos usuários.

## 5. Recuperação e acompanhamento

Após enviar a correção:

1. Verifique as remediações no CI e nos artefatos de lançamento.
2. Execute uma breve análise pós-incidente (linha do tempo, causa raiz, lacuna de detecção, plano de prevenção).
3. Adicione tarefas de acompanhamento para fortalecimento/testes/docs e acompanhe-as até a conclusão.
