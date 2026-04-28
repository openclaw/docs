---
read_when:
- Revisando postura de segurança ou cenários de ameaça
- Working on security features or audit responses
summary: Modelo de ameaças do OpenClaw mapeado para o framework MITRE ATLAS
title: Modelo de ameaças (MITRE ATLAS)
x-i18n:
  generated_at: '2026-04-24T06:12:36Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
  source_path: security/THREAT-MODEL-ATLAS.md
  workflow: 15
---

# Modelo de ameaças do OpenClaw v1.0

## Framework MITRE ATLAS

**Versão:** 1.0-draft
**Última atualização:** 2026-02-04
**Metodologia:** MITRE ATLAS + Diagramas de fluxo de dados
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Atribuição do framework

Este modelo de ameaças é construído com base no [MITRE ATLAS](https://atlas.mitre.org/), o framework padrão da indústria para documentar ameaças adversariais a sistemas de IA/ML. O ATLAS é mantido pela [MITRE](https://www.mitre.org/) em colaboração com a comunidade de segurança em IA.

**Principais recursos do ATLAS:**

- [Técnicas ATLAS](https://atlas.mitre.org/techniques/)
- [Táticas ATLAS](https://atlas.mitre.org/tactics/)
- [Estudos de caso ATLAS](https://atlas.mitre.org/studies/)
- [GitHub do ATLAS](https://github.com/mitre-atlas/atlas-data)
- [Contribuindo para o ATLAS](https://atlas.mitre.org/resources/contribute)

### Contribuindo para este modelo de ameaças

Este é um documento vivo mantido pela comunidade OpenClaw. Consulte [CONTRIBUTING-THREAT-MODEL.md](/pt-BR/security/CONTRIBUTING-THREAT-MODEL) para orientações sobre como contribuir:

- Relatar novas ameaças
- Atualizar ameaças existentes
- Propor cadeias de ataque
- Sugerir mitigações

---

## 1. Introdução

### 1.1 Objetivo

Este modelo de ameaças documenta ameaças adversariais à plataforma de agentes de IA OpenClaw e ao marketplace de Skills ClawHub, usando o framework MITRE ATLAS projetado especificamente para sistemas de IA/ML.

### 1.2 Escopo

| Componente                | Incluído | Observações                                       |
| ------------------------- | -------- | ------------------------------------------------- |
| Runtime do agente OpenClaw | Sim      | Execução principal do agente, chamadas de tools, sessões |
| Gateway                   | Sim      | Autenticação, roteamento, integração de canais    |
| Integrações de canal      | Sim      | WhatsApp, Telegram, Discord, Signal, Slack etc.   |
| Marketplace ClawHub       | Sim      | Publicação, moderação e distribuição de Skills    |
| Servidores MCP            | Sim      | Providers externos de tools                       |
| Dispositivos do usuário   | Parcial  | Apps móveis, clientes desktop                     |

### 1.3 Fora do escopo

Nada está explicitamente fora do escopo deste modelo de ameaças.

---

## 2. Arquitetura do sistema

### 2.1 Boundaries de confiança

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NÃO CONFIÁVEL                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│            BOUNDARY DE CONFIANÇA 1: Acesso ao canal             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       GATEWAY                            │   │
│  │  • Pareamento de dispositivo (1h DM / período de graça de 5m do node) │   │
│  │  • Validação de AllowFrom / AllowList                   │   │
│  │  • Autenticação por token/senha/Tailscale              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          BOUNDARY DE CONFIANÇA 2: Isolamento de sessão          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SESSÕES DE AGENTE                       │   │
│  │  • Chave de sessão = agent:channel:peer                  │   │
│  │  • Políticas de tools por agente                         │   │
│  │  • Logging de transcrição                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          BOUNDARY DE CONFIANÇA 3: Execução de tools            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                SANDBOX DE EXECUÇÃO                       │   │
│  │  • Sandbox Docker OU host (exec-approvals)              │   │
│  │  • Execução remota de Node                              │   │
│  │  • Proteção SSRF (fixação de DNS + bloqueio de IP)      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         BOUNDARY DE CONFIANÇA 4: Conteúdo externo               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          URLs / EMAILS / WEBHOOKS OBTIDOS                │   │
│  │  • Encapsulamento de conteúdo externo (tags XML)         │   │
│  │  • Injeção de aviso de segurança                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          BOUNDARY DE CONFIANÇA 5: Cadeia de suprimentos         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                             │   │
│  │  • Publicação de Skill (semver, SKILL.md obrigatório)   │   │
│  │  • Flags de moderação baseadas em padrões               │   │
│  │  • Varredura VirusTotal (em breve)                      │   │
│  │  • Verificação da idade da conta GitHub                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Fluxos de dados

| Fluxo | Origem  | Destino     | Dados              | Proteção             |
| ----- | ------- | ----------- | ------------------ | -------------------- |
| F1    | Canal   | Gateway     | Mensagens do usuário | TLS, AllowFrom     |
| F2    | Gateway | Agente      | Mensagens roteadas | Isolamento de sessão |
| F3    | Agente  | Tools       | Invocações de tools | Aplicação de política |
| F4    | Agente  | Externo     | requisições `web_fetch` | Bloqueio SSRF   |
| F5    | ClawHub | Agente      | Código de Skill    | Moderação, varredura |
| F6    | Agente  | Canal       | Respostas          | Filtragem de saída   |

---

## 3. Análise de ameaças por tática ATLAS

### 3.1 Reconhecimento (AML.TA0002)

#### T-RECON-001: Descoberta de endpoint do agente

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Varredura ativa                                          |
| **Descrição**           | O atacante varre endpoints expostos do gateway OpenClaw              |
| **Vetor de ataque**     | Varredura de rede, consultas no Shodan, enumeração de DNS            |
| **Componentes afetados** | Gateway, endpoints de API expostos                                  |
| **Mitigações atuais**   | Opção de autenticação Tailscale, bind em loopback por padrão         |
| **Risco residual**      | Médio - Gateways públicos são detectáveis                            |
| **Recomendações**       | Documentar implantação segura, adicionar rate limiting em endpoints de descoberta |

#### T-RECON-002: Sondagem de integração de canal

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Varredura ativa                                          |
| **Descrição**           | O atacante sonda canais de mensagens para identificar contas gerenciadas por IA |
| **Vetor de ataque**     | Envio de mensagens de teste, observação de padrões de resposta       |
| **Componentes afetados** | Todas as integrações de canal                                       |
| **Mitigações atuais**   | Nenhuma específica                                                   |
| **Risco residual**      | Baixo - Descoberta por si só tem valor limitado                     |
| **Recomendações**       | Considerar randomização do tempo de resposta                         |

---

### 3.2 Acesso inicial (AML.TA0004)

#### T-ACCESS-001: Interceptação de código de pareamento

| Atributo                | Valor                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Acesso à API de inferência do modelo de IA                                                        |
| **Descrição**           | O atacante intercepta o código de pareamento durante o período de graça do pareamento (1h para pareamento DM de canal, 5m para pareamento de node) |
| **Vetor de ataque**     | Observação por cima do ombro, sniffing de rede, engenharia social                                             |
| **Componentes afetados** | Sistema de pareamento de dispositivo                                                                         |
| **Mitigações atuais**   | Expiração em 1h (pareamento DM) / 5m (pareamento de node), códigos enviados pelo canal existente            |
| **Risco residual**      | Médio - Período de graça explorável                                                                          |
| **Recomendações**       | Reduzir o período de graça, adicionar etapa de confirmação                                                   |

#### T-ACCESS-002: Falsificação de AllowFrom

| Atributo                | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - Acesso à API de inferência do modelo de IA                         |
| **Descrição**           | O atacante falsifica a identidade permitida do remetente no canal              |
| **Vetor de ataque**     | Depende do canal - falsificação de número de telefone, impersonação de nome de usuário |
| **Componentes afetados** | Validação AllowFrom por canal                                                  |
| **Mitigações atuais**   | Verificação de identidade específica do canal                                   |
| **Risco residual**      | Médio - Alguns canais são vulneráveis à falsificação                           |
| **Recomendações**       | Documentar riscos específicos de cada canal, adicionar verificação criptográfica quando possível |

#### T-ACCESS-003: Roubo de token

| Atributo                | Valor                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Acesso à API de inferência do modelo de IA      |
| **Descrição**           | O atacante rouba tokens de autenticação de arquivos de configuração |
| **Vetor de ataque**     | Malware, acesso não autorizado ao dispositivo, exposição de backup de configuração |
| **Componentes afetados** | `~/.openclaw/credentials/`, armazenamento de configuração  |
| **Mitigações atuais**   | Permissões de arquivo                                       |
| **Risco residual**      | Alto - Tokens armazenados em texto simples                  |
| **Recomendações**       | Implementar criptografia de tokens em repouso, adicionar rotação de token |

---

### 3.3 Execução (AML.TA0005)

#### T-EXEC-001: Injeção direta de prompt

| Atributo                | Valor                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - Injeção de prompt em LLM: direta                                          |
| **Descrição**           | O atacante envia prompts elaborados para manipular o comportamento do agente              |
| **Vetor de ataque**     | Mensagens de canal contendo instruções adversariais                                       |
| **Componentes afetados** | LLM do agente, todas as superfícies de entrada                                           |
| **Mitigações atuais**   | Detecção de padrão, encapsulamento de conteúdo externo                                    |
| **Risco residual**      | Crítico - Apenas detecção, sem bloqueio; ataques sofisticados contornam                   |
| **Recomendações**       | Implementar defesa em várias camadas, validação de saída, confirmação do usuário para ações sensíveis |

#### T-EXEC-002: Injeção indireta de prompt

| Atributo                | Valor                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - Injeção de prompt em LLM: indireta          |
| **Descrição**           | O atacante incorpora instruções maliciosas em conteúdo obtido |
| **Vetor de ataque**     | URLs maliciosas, emails envenenados, webhooks comprometidos |
| **Componentes afetados** | `web_fetch`, ingestão de email, fontes externas de dados   |
| **Mitigações atuais**   | Encapsulamento de conteúdo com tags XML e aviso de segurança |
| **Risco residual**      | Alto - O LLM pode ignorar instruções de encapsulamento      |
| **Recomendações**       | Implementar sanitização de conteúdo, contextos de execução separados |

#### T-EXEC-003: Injeção de argumento de tool

| Atributo                | Valor                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0051.000 - Injeção de prompt em LLM: direta             |
| **Descrição**           | O atacante manipula argumentos de tool por meio de injeção de prompt |
| **Vetor de ataque**     | Prompts elaborados que influenciam valores de parâmetros de tool |
| **Componentes afetados** | Todas as invocações de tool                                 |
| **Mitigações atuais**   | Aprovações de exec para comandos perigosos                   |
| **Risco residual**      | Alto - Depende do julgamento do usuário                      |
| **Recomendações**       | Implementar validação de argumentos, chamadas de tool parametrizadas |

#### T-EXEC-004: Bypass de aprovação de exec

| Atributo                | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Criar dados adversariais                       |
| **Descrição**           | O atacante cria comandos que contornam a lista de permissões de aprovação |
| **Vetor de ataque**     | Ofuscação de comando, exploração de alias, manipulação de caminho |
| **Componentes afetados** | `exec-approvals.ts`, lista de permissões de comando       |
| **Mitigações atuais**   | Lista de permissões + modo ask                             |
| **Risco residual**      | Alto - Sem sanitização de comando                          |
| **Recomendações**       | Implementar normalização de comando, expandir blocklist    |

---

### 3.4 Persistência (AML.TA0006)

#### T-PERSIST-001: Instalação de Skill maliciosa

| Atributo                | Valor                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0010.001 - Comprometimento da cadeia de suprimentos: software de IA |
| **Descrição**           | O atacante publica uma Skill maliciosa no ClawHub                        |
| **Vetor de ataque**     | Criar conta, publicar Skill com código malicioso oculto                  |
| **Componentes afetados** | ClawHub, carregamento de Skill, execução do agente                      |
| **Mitigações atuais**   | Verificação da idade da conta GitHub, flags de moderação baseadas em padrões |
| **Risco residual**      | Crítico - Sem sandboxing, revisão limitada                               |
| **Recomendações**       | Integração com VirusTotal (em andamento), sandboxing de Skill, revisão da comunidade |

#### T-PERSIST-002: Envenenamento de update de Skill

| Atributo                | Valor                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Comprometimento da cadeia de suprimentos: software de IA |
| **Descrição**           | O atacante compromete uma Skill popular e envia um update malicioso |
| **Vetor de ataque**     | Comprometimento de conta, engenharia social contra o dono da Skill |
| **Componentes afetados** | Versionamento do ClawHub, fluxos de atualização automática     |
| **Mitigações atuais**   | Fingerprinting de versão                                       |
| **Risco residual**      | Alto - Atualizações automáticas podem puxar versões maliciosas |
| **Recomendações**       | Implementar assinatura de update, capacidade de rollback, fixação de versão |

#### T-PERSIST-003: Adulteração da configuração do agente

| Atributo                | Valor                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.002 - Comprometimento da cadeia de suprimentos: dados |
| **Descrição**           | O atacante modifica a configuração do agente para persistir acesso |
| **Vetor de ataque**     | Modificação de arquivo de configuração, injeção de settings     |
| **Componentes afetados** | Configuração do agente, políticas de tools                     |
| **Mitigações atuais**   | Permissões de arquivo                                           |
| **Risco residual**      | Médio - Exige acesso local                                      |
| **Recomendações**       | Verificação de integridade da configuração, logging de auditoria para mudanças de configuração |

---

### 3.5 Evasão de defesa (AML.TA0007)

#### T-EVADE-001: Bypass de padrão de moderação

| Atributo                | Valor                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Criar dados adversariais                                   |
| **Descrição**           | O atacante cria conteúdo de Skill para escapar de padrões de moderação |
| **Vetor de ataque**     | Homógrafos Unicode, truques de codificação, carregamento dinâmico      |
| **Componentes afetados** | `moderation.ts` do ClawHub                                            |
| **Mitigações atuais**   | `FLAG_RULES` baseadas em padrões                                       |
| **Risco residual**      | Alto - Regex simples é facilmente contornado                           |
| **Recomendações**       | Adicionar análise comportamental (VirusTotal Code Insight), detecção baseada em AST |

#### T-EVADE-002: Escape de encapsulamento de conteúdo

| Atributo                | Valor                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Criar dados adversariais                      |
| **Descrição**           | O atacante cria conteúdo que escapa do contexto de encapsulamento XML |
| **Vetor de ataque**     | Manipulação de tags, confusão de contexto, sobrescrita de instrução |
| **Componentes afetados** | Encapsulamento de conteúdo externo                       |
| **Mitigações atuais**   | Tags XML + aviso de segurança                             |
| **Risco residual**      | Médio - Novas formas de escape são descobertas regularmente |
| **Recomendações**       | Múltiplas camadas de encapsulamento, validação no lado da saída |

---

### 3.6 Descoberta (AML.TA0008)

#### T-DISC-001: Enumeração de tools

| Atributo                | Valor                                                  |
| ----------------------- | ------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - Acesso à API de inferência do modelo de IA |
| **Descrição**           | O atacante enumera tools disponíveis por meio de prompting |
| **Vetor de ataque**     | Consultas do tipo “Quais tools você tem?”              |
| **Componentes afetados** | Registro de tools do agente                           |
| **Mitigações atuais**   | Nenhuma específica                                     |
| **Risco residual**      | Baixo - As tools geralmente são documentadas           |
| **Recomendações**       | Considerar controles de visibilidade de tools          |

#### T-DISC-002: Extração de dados de sessão

| Atributo                | Valor                                                  |
| ----------------------- | ------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - Acesso à API de inferência do modelo de IA |
| **Descrição**           | O atacante extrai dados sensíveis do contexto da sessão |
| **Vetor de ataque**     | Consultas do tipo “Sobre o que discutimos?”, sondagem de contexto |
| **Componentes afetados** | Transcrições de sessão, janela de contexto            |
| **Mitigações atuais**   | Isolamento de sessão por remetente                     |
| **Risco residual**      | Médio - Dados dentro da sessão são acessíveis          |
| **Recomendações**       | Implementar redação de dados sensíveis no contexto     |

---

### 3.7 Coleta e exfiltração (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Roubo de dados via web_fetch

| Atributo                | Valor                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Coleta                                                     |
| **Descrição**           | O atacante exfiltra dados instruindo o agente a enviar para uma URL externa |
| **Vetor de ataque**     | Injeção de prompt fazendo o agente enviar dados por POST para o servidor do atacante |
| **Componentes afetados** | Tool `web_fetch`                                                      |
| **Mitigações atuais**   | Bloqueio SSRF para redes internas                                     |
| **Risco residual**      | Alto - URLs externas são permitidas                                   |
| **Recomendações**       | Implementar allowlist de URL, consciência de classificação de dados    |

#### T-EXFIL-002: Envio não autorizado de mensagens

| Atributo                | Valor                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Coleta                                               |
| **Descrição**           | O atacante faz o agente enviar mensagens contendo dados sensíveis |
| **Vetor de ataque**     | Injeção de prompt fazendo o agente mandar mensagem ao atacante   |
| **Componentes afetados** | Tool de mensagem, integrações de canal                          |
| **Mitigações atuais**   | Gating de mensagens de saída                                     |
| **Risco residual**      | Médio - O gating pode ser contornado                            |
| **Recomendações**       | Exigir confirmação explícita para novos destinatários           |

#### T-EXFIL-003: Coleta de credenciais

| Atributo                | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Coleta                                         |
| **Descrição**           | Skill maliciosa coleta credenciais do contexto do agente   |
| **Vetor de ataque**     | Código da Skill lê variáveis de ambiente, arquivos de configuração |
| **Componentes afetados** | Ambiente de execução da Skill                             |
| **Mitigações atuais**   | Nenhuma específica para Skills                             |
| **Risco residual**      | Crítico - Skills executam com privilégios do agente        |
| **Recomendações**       | Sandboxing de Skill, isolamento de credenciais             |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Execução não autorizada de comandos

| Atributo                | Valor                                               |
| ----------------------- | --------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erodir a integridade do modelo de IA    |
| **Descrição**           | O atacante executa comandos arbitrários no sistema do usuário |
| **Vetor de ataque**     | Injeção de prompt combinada com bypass de aprovação de exec |
| **Componentes afetados** | Tool Bash, execução de comando                      |
| **Mitigações atuais**   | Aprovações de Exec, opção de sandbox Docker         |
| **Risco residual**      | Crítico - Execução no host sem sandbox              |
| **Recomendações**       | Usar sandbox por padrão, melhorar a UX de aprovação |

#### T-IMPACT-002: Exaustão de recursos (DoS)

| Atributo                | Valor                                              |
| ----------------------- | -------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erodir a integridade do modelo de IA   |
| **Descrição**           | O atacante esgota créditos de API ou recursos computacionais |
| **Vetor de ataque**     | Inundação automatizada de mensagens, chamadas caras de tools |
| **Componentes afetados** | Gateway, sessões de agente, provider de API       |
| **Mitigações atuais**   | Nenhuma                                            |
| **Risco residual**      | Alto - Sem rate limiting                           |
| **Recomendações**       | Implementar limites por remetente, orçamentos de custo |

#### T-IMPACT-003: Dano reputacional

| Atributo                | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erodir a integridade do modelo de IA           |
| **Descrição**           | O atacante faz o agente enviar conteúdo prejudicial/ofensivo |
| **Vetor de ataque**     | Injeção de prompt causando respostas inadequadas           |
| **Componentes afetados** | Geração de saída, mensagens de canal                      |
| **Mitigações atuais**   | Políticas de conteúdo do provider de LLM                   |
| **Risco residual**      | Médio - Filtros do provider são imperfeitos                |
| **Recomendações**       | Camada de filtragem de saída, controles do usuário         |

---

## 4. Análise da cadeia de suprimentos do ClawHub

### 4.1 Controles de segurança atuais

| Controle             | Implementação               | Efetividade                                             |
| -------------------- | --------------------------- | ------------------------------------------------------- |
| Idade da conta GitHub | `requireGitHubAccountAge()` | Média - Eleva a barreira para novos atacantes          |
| Sanitização de caminho | `sanitizePath()`           | Alta - Impede path traversal                           |
| Validação de tipo de arquivo | `isTextFile()`     | Média - Apenas arquivos de texto, mas ainda podem ser maliciosos |
| Limites de tamanho   | 50MB total do bundle        | Alta - Impede exaustão de recursos                     |
| SKILL.md obrigatório | Readme obrigatório          | Baixo valor de segurança - Apenas informativo          |
| Moderação por padrão | `FLAG_RULES` em `moderation.ts` | Baixa - Facilmente contornável                     |
| Status de moderação  | Campo `moderationStatus`    | Média - Revisão manual possível                        |

### 4.2 Padrões de flags de moderação

Padrões atuais em `moderation.ts`:

```javascript
// Identificadores sabidamente maliciosos
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Palavras-chave suspeitas
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Limitações:**

- Verifica apenas slug, displayName, summary, frontmatter, metadata e caminhos de arquivo
- Não analisa o conteúdo real do código da Skill
- Regex simples é facilmente contornado com ofuscação
- Sem análise comportamental

### 4.3 Melhorias planejadas

| Melhoria               | Status                                | Impacto                                                              |
| ---------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Integração com VirusTotal | Em andamento                        | Alto - Análise comportamental com Code Insight                      |
| Relato da comunidade   | Parcial (tabela `skillReports` existe) | Médio                                                               |
| Logging de auditoria   | Parcial (tabela `auditLogs` existe)    | Médio                                                               |
| Sistema de badges      | Implementado                           | Médio - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Matriz de risco

### 5.1 Probabilidade vs impacto

| ID da ameaça   | Probabilidade | Impacto  | Nível de risco | Prioridade |
| -------------- | ------------- | -------- | -------------- | ---------- |
| T-EXEC-001     | Alta          | Crítico  | **Crítico**    | P0         |
| T-PERSIST-001  | Alta          | Crítico  | **Crítico**    | P0         |
| T-EXFIL-003    | Média         | Crítico  | **Crítico**    | P0         |
| T-IMPACT-001   | Média         | Crítico  | **Alto**       | P1         |
| T-EXEC-002     | Alta          | Alto     | **Alto**       | P1         |
| T-EXEC-004     | Média         | Alto     | **Alto**       | P1         |
| T-ACCESS-003   | Média         | Alto     | **Alto**       | P1         |
| T-EXFIL-001    | Média         | Alto     | **Alto**       | P1         |
| T-IMPACT-002   | Alta          | Médio    | **Alto**       | P1         |
| T-EVADE-001    | Alta          | Médio    | **Médio**      | P2         |
| T-ACCESS-001   | Baixa         | Alto     | **Médio**      | P2         |
| T-ACCESS-002   | Baixa         | Alto     | **Médio**      | P2         |
| T-PERSIST-002  | Baixa         | Alto     | **Médio**      | P2         |

### 5.2 Cadeias críticas de ataque

**Cadeia de ataque 1: Roubo de dados baseado em Skill**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publicar Skill maliciosa) → (Escapar da moderação) → (Coletar credenciais)
```

**Cadeia de ataque 2: Injeção de prompt para RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Injetar prompt) → (Contornar aprovação de exec) → (Executar comandos)
```

**Cadeia de ataque 3: Injeção indireta via conteúdo obtido**

```
T-EXEC-002 → T-EXFIL-001 → Exfiltração externa
(Envenenar conteúdo de URL) → (Agente busca e segue instruções) → (Dados enviados ao atacante)
```

---

## 6. Resumo das recomendações

### 6.1 Imediato (P0)

| ID    | Recomendação                                  | Endereça                   |
| ----- | --------------------------------------------- | -------------------------- |
| R-001 | Concluir a integração com VirusTotal          | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementar sandboxing de Skill               | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Adicionar validação de saída para ações sensíveis | T-EXEC-001, T-EXEC-002  |

### 6.2 Curto prazo (P1)

| ID    | Recomendação                              | Endereça     |
| ----- | ----------------------------------------- | ------------ |
| R-004 | Implementar rate limiting                 | T-IMPACT-002 |
| R-005 | Adicionar criptografia de token em repouso | T-ACCESS-003 |
| R-006 | Melhorar UX e validação de aprovação de exec | T-EXEC-004 |
| R-007 | Implementar allowlisting de URL para `web_fetch` | T-EXFIL-001 |

### 6.3 Médio prazo (P2)

| ID    | Recomendação                                        | Endereça      |
| ----- | --------------------------------------------------- | -------------- |
| R-008 | Adicionar verificação criptográfica de canal onde possível | T-ACCESS-002 |
| R-009 | Implementar verificação de integridade de configuração | T-PERSIST-003 |
| R-010 | Adicionar assinatura de update e fixação de versão  | T-PERSIST-002 |

---

## 7. Apêndices

### 7.1 Mapeamento de técnicas ATLAS

| ATLAS ID      | Nome da técnica                | Ameaças do OpenClaw                                             |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Varredura ativa                | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Coleta                         | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Cadeia de suprimentos: software de IA | T-PERSIST-001, T-PERSIST-002                              |
| AML.T0010.002 | Cadeia de suprimentos: dados   | T-PERSIST-003                                                    |
| AML.T0031     | Erodir a integridade do modelo de IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                   |
| AML.T0040     | Acesso à API de inferência do modelo de IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Criar dados adversariais       | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Injeção de prompt em LLM: direta | T-EXEC-001, T-EXEC-003                                         |
| AML.T0051.001 | Injeção de prompt em LLM: indireta | T-EXEC-002                                                    |

### 7.2 Principais arquivos de segurança

| Caminho                             | Finalidade                  | Nível de risco |
| ----------------------------------- | --------------------------- | -------------- |
| `src/infra/exec-approvals.ts`       | Lógica de aprovação de comando | **Crítico** |
| `src/gateway/auth.ts`               | Autenticação do Gateway     | **Crítico**    |
| `src/infra/net/ssrf.ts`             | Proteção SSRF              | **Crítico**    |
| `src/security/external-content.ts`  | Mitigação de injeção de prompt | **Crítico** |
| `src/agents/sandbox/tool-policy.ts` | Aplicação de política de tools | **Crítico** |
| `src/routing/resolve-route.ts`      | Isolamento de sessão        | **Médio**      |

### 7.3 Glossário

| Termo                | Definição                                                |
| -------------------- | -------------------------------------------------------- |
| **ATLAS**            | Adversarial Threat Landscape for AI Systems da MITRE     |
| **ClawHub**          | Marketplace de Skills do OpenClaw                        |
| **Gateway**          | Camada de roteamento de mensagens e autenticação do OpenClaw |
| **MCP**              | Model Context Protocol - interface de provider de tools  |
| **Prompt Injection** | Ataque em que instruções maliciosas são incorporadas à entrada |
| **Skill**            | Extensão baixável para agentes OpenClaw                  |
| **SSRF**             | Server-Side Request Forgery                              |

---

_Este modelo de ameaças é um documento vivo. Relate problemas de segurança para security@openclaw.ai_

## Relacionado

- [Verificação formal](/pt-BR/security/formal-verification)
- [Contribuindo para o modelo de ameaças](/pt-BR/security/CONTRIBUTING-THREAT-MODEL)
