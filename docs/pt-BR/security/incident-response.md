---
read_when:
    - Resposta a um relato de segurança ou a uma suspeita de incidente de segurança
    - Preparando uma divulgação coordenada ou uma versão de segurança corrigida
    - Revisão das expectativas de acompanhamento pós-incidente
summary: Como o OpenClaw faz a triagem, responde e acompanha incidentes de segurança
title: Resposta a incidentes
x-i18n:
    generated_at: "2026-07-12T15:46:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Detecção e triagem

Os sinais de segurança vêm de:

- Avisos de Segurança do GitHub (GHSA) e relatórios privados de vulnerabilidades.
- Issues/discussões públicas no GitHub quando os relatos não são confidenciais.
- Sinais automatizados: Dependabot, CodeQL, avisos do npm, verificação de segredos.

Triagem inicial:

1. Confirme o componente e a versão afetados, bem como o impacto no limite de confiança.
2. Classifique como um problema de segurança ou como reforço/nenhuma ação, usando as regras de escopo e de itens fora do escopo do `SECURITY.md`.
3. Um responsável pelo incidente responde de acordo.

## 2. Severidade

| Severidade | Definição                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crítica    | Comprometimento de pacote/versão/repositório, exploração ativa ou evasão não autenticada do limite de confiança com controle de alto impacto ou exposição de dados.                                      |
| Alta       | Evasão verificada do limite de confiança que exige pré-condições limitadas (por exemplo, uma ação autenticada, porém não autorizada, de alto impacto) ou exposição de credenciais confidenciais do OpenClaw. |
| Média      | Fragilidade de segurança significativa com impacto prático, mas com possibilidade de exploração limitada ou pré-requisitos substanciais.                                                                |
| Baixa      | Constatações de defesa em profundidade, negação de serviço de escopo restrito ou lacunas de reforço/paridade sem evasão demonstrada do limite de confiança.                                               |

## 3. Resposta

1. Confirme o recebimento ao relator (em particular quando for confidencial).
2. Reproduza nas versões compatíveis e na versão mais recente de `main`; em seguida, implemente e valide uma correção com cobertura contra regressões.
3. Crítica/alta: prepare versões corrigidas o mais rápido possível.
4. Média/baixa: aplique a correção no fluxo normal de lançamento e documente as orientações de mitigação.

## 4. Comunicação e divulgação

Comunique-se por meio dos Avisos de Segurança do GitHub no repositório afetado, das notas de versão/entradas do changelog para as versões corrigidas e do acompanhamento direto com o relator sobre o status e a resolução.

Incidentes críticos/de alta severidade recebem divulgação coordenada, com emissão de CVE quando apropriado. Constatações de reforço de baixo risco podem ser documentadas em notas de versão ou avisos sem um CVE, dependendo do impacto e da exposição dos usuários.

## 5. Recuperação e acompanhamento

Após disponibilizar a correção:

1. Verifique as remediações na CI e nos artefatos da versão.
2. Faça uma breve análise pós-incidente: cronologia, causa raiz, lacuna de detecção e plano de prevenção.
3. Adicione tarefas de acompanhamento de reforço/testes/documentação e monitore-as até a conclusão.

## Relacionado

- [Política de segurança](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — escopo dos relatos e modelo de confiança.
- [Modelo de ameaças](/pt-BR/security/THREAT-MODEL-ATLAS)
