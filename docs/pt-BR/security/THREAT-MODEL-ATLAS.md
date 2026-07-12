---
read_when:
    - Analisando a postura de segurança ou cenários de ameaças
    - Trabalhando em recursos de segurança ou respostas a auditorias
summary: Modelo de ameaças do OpenClaw mapeado para o framework MITRE ATLAS
title: Modelo de ameaças (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T15:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Versão:** 1.0-draft | **Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Cenário de ameaças adversariais para sistemas de IA) + diagramas de fluxo de dados

Este modelo de ameaças documenta ameaças adversariais à plataforma de agentes de IA OpenClaw e ao marketplace de habilidades ClawHub. É um documento vivo mantido pela comunidade OpenClaw. Consulte [Como contribuir com o modelo de ameaças](/pt-BR/security/CONTRIBUTING-THREAT-MODEL) para saber como relatar novas ameaças, propor cadeias de ataque ou sugerir mitigações.

**Principais recursos do ATLAS:** [Técnicas](https://atlas.mitre.org/techniques/) | [Táticas](https://atlas.mitre.org/tactics/) | [Estudos de caso](https://atlas.mitre.org/studies/) | [ATLAS no GitHub](https://github.com/mitre-atlas/atlas-data) | [Como contribuir com o ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Escopo

| Componente                    | Incluído | Observações                                            |
| ----------------------------- | -------- | ------------------------------------------------------ |
| Runtime de agentes OpenClaw   | Sim      | Execução central de agentes, chamadas de ferramentas, sessões |
| Gateway                       | Sim      | Autenticação, roteamento, integração com canais         |
| Integrações de canais         | Sim      | WhatsApp, Telegram, Discord, Signal, Slack etc.         |
| Marketplace ClawHub           | Sim      | Publicação, moderação e distribuição de habilidades     |
| Servidores MCP                | Sim      | Provedores externos de ferramentas                      |
| Dispositivos dos usuários     | Parcial  | Aplicativos móveis, clientes para desktop               |

Relatos fora do escopo e padrões de falsos positivos (exposição à internet pública, cadeias somente de injeção de prompt sem contornar um limite, operadores que não confiam uns nos outros compartilhando um único host de gateway, entre outros) estão enumerados em [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); esse arquivo, e não esta página, é a fonte da verdade atual sobre o escopo dos relatos de vulnerabilidade.

## 2. Arquitetura do sistema

### 2.1 Limites de confiança

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NÃO CONFIÁVEL                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LIMITE DE CONFIANÇA 1: Acesso ao canal           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Pareamento de dispositivo (pareamento por DM de 1h /   │   │
│  │    TTL de pareamento de Node de 5m)                       │   │
│  │  • Validação de AllowFrom / lista de permissões           │   │
│  │  • Autenticação por token / senha / Tailscale             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LIMITE DE CONFIANÇA 2: Isolamento de sessões     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESSÕES DE AGENTES                      │   │
│  │  • Chave da sessão = agente:canal:par                     │   │
│  │  • Políticas de ferramentas por agente                    │   │
│  │  • Registro de transcrições                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LIMITE DE CONFIANÇA 3: Execução de ferramentas   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SANDBOX DE EXECUÇÃO                      │   │
│  │  • Sandbox Docker (padrão) ou host (aprovações de exec)   │   │
│  │  • Execução remota em Node                                │   │
│  │  • Proteção contra SSRF (fixação de DNS + bloqueio de IP)  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LIMITE DE CONFIANÇA 4: Conteúdo externo          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              URLs / E-MAILS / WEBHOOKS OBTIDOS            │   │
│  │  • Encapsulamento de conteúdo externo                     │   │
│  │    (tags XML com limite aleatório)                        │   │
│  │  • Injeção de avisos de segurança                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LIMITE DE CONFIANÇA 5: Cadeia de suprimentos     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publicação de habilidades (semver, SKILL.md obrigatório)│   │
│  │  • Varredura de moderação por padrões estáticos e         │   │
│  │    estruturas próximas à AST                              │   │
│  │  • Análise agêntica de riscos baseada em LLM + varredura   │   │
│  │    do VirusTotal                                          │   │
│  │  • Verificação da idade da conta do GitHub (14 dias)      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Fluxos de dados

| Fluxo | Origem  | Destino     | Dados                    | Proteção                         |
| ----- | ------- | ----------- | ------------------------ | -------------------------------- |
| F1    | Canal   | Gateway     | Mensagens dos usuários   | TLS, AllowFrom                   |
| F2    | Gateway | Agente      | Mensagens roteadas       | Isolamento de sessões            |
| F3    | Agente  | Ferramentas | Invocações de ferramentas | Aplicação de políticas           |
| F4    | Agente  | Externo     | Solicitações `web_fetch` | Bloqueio de SSRF                  |
| F5    | ClawHub | Agente      | Código de habilidades    | Moderação, varredura              |
| F6    | Agente  | Canal       | Respostas                | Filtragem de saída                |

---

## 3. Análise de ameaças por tática do ATLAS

### 3.1 Reconhecimento (AML.TA0002)

#### T-RECON-001: Descoberta de endpoints de agentes

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID do ATLAS**         | AML.T0006 - Varredura ativa                                          |
| **Descrição**           | O invasor procura endpoints expostos do Gateway OpenClaw             |
| **Vetor de ataque**     | Varredura de rede, consultas ao Shodan, enumeração de DNS            |
| **Componentes afetados** | Gateway, endpoints de API expostos                                  |
| **Mitigações atuais**   | Opção de autenticação por Tailscale, vinculação ao loopback por padrão |
| **Risco residual**      | Médio - gateways públicos podem ser descobertos                      |
| **Recomendações**       | Documentar a implantação segura, adicionar limitação de taxa aos endpoints de descoberta |

#### T-RECON-002: Sondagem de integrações de canais

| Atributo                | Valor                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| **ID do ATLAS**         | AML.T0006 - Varredura ativa                                          |
| **Descrição**           | O invasor sonda canais de mensagens para identificar contas gerenciadas por IA |
| **Vetor de ataque**     | Envio de mensagens de teste, observação de padrões de resposta       |
| **Componentes afetados** | Todas as integrações de canais                                      |
| **Mitigações atuais**   | Nenhuma específica                                                   |
| **Risco residual**      | Baixo - valor limitado apenas com a descoberta                       |
| **Recomendações**       | Considerar a aleatorização do tempo de resposta                      |

---

### 3.2 Acesso inicial (AML.TA0004)

#### T-ACCESS-001: Interceptação do código de pareamento

| Atributo                | Valor                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acesso à API de inferência de modelo de IA                                                           |
| **Descrição**           | O invasor intercepta um código de pareamento durante a janela de pareamento (1h para pareamento por DM/genérico, 5m para pareamento de Node) |
| **Vetor de ataque**     | Observação por terceiros, interceptação de rede, engenharia social                                               |
| **Componentes afetados** | Sistema de pareamento de dispositivos                                                                           |
| **Mitigações atuais**   | TTL de 1h (pareamento por DM/genérico), TTL de 5m (pareamento de Node); códigos enviados pelo canal existente    |
| **Risco residual**      | Médio - a janela de pareamento pode ser explorada                                                                |
| **Recomendações**       | Reduzir a janela de pareamento, adicionar uma etapa de confirmação                                               |

#### T-ACCESS-002: Falsificação de AllowFrom

| Atributo                | Valor                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acesso à API de inferência de modelo de IA                                        |
| **Descrição**           | O invasor falsifica a identidade de um remetente permitido em um canal                        |
| **Vetor de ataque**     | Dependente do canal - falsificação de número de telefone, personificação de nome de usuário   |
| **Componentes afetados** | Validação de AllowFrom por canal                                                              |
| **Mitigações atuais**   | Verificação de identidade específica do canal                                                 |
| **Risco residual**      | Médio - alguns canais permanecem vulneráveis à falsificação                                   |
| **Recomendações**       | Documentar os riscos específicos de cada canal, adicionar verificação criptográfica quando possível |

#### T-ACCESS-003: Roubo de tokens

| Atributo                | Valor                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acesso à API de inferência de modelo de IA                        |
| **Descrição**           | O invasor rouba tokens de autenticação de arquivos de configuração/credenciais |
| **Vetor de ataque**     | Malware, acesso não autorizado ao dispositivo, exposição de backup de configuração |
| **Componentes afetados** | Armazenamento de credenciais de canal/provedor, armazenamento de configuração |
| **Mitigações atuais**   | Permissões de arquivo                                                         |
| **Risco residual**      | Alto - tokens armazenados em texto simples no disco                           |
| **Recomendações**       | Implementar criptografia de tokens em repouso, adicionar rotação de tokens    |

---

### 3.3 Execução (AML.TA0005)

#### T-EXEC-001: Injeção direta de prompt

| Atributo                | Valor                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.000 - Injeção de prompt em LLM: direta                                                                                                       |
| **Descrição**           | O invasor envia prompts elaborados para manipular o comportamento do agente                                                                            |
| **Vetor de ataque**     | Mensagens de canal contendo instruções adversariais                                                                                                    |
| **Componentes afetados** | LLM do agente, todas as superfícies de entrada                                                                                                         |
| **Mitigações atuais**   | Detecção de padrões, encapsulamento de conteúdo externo; tratada como fora do escopo de relatórios de vulnerabilidade na ausência de evasão de um limite de segurança (consulte `SECURITY.md`) |
| **Risco residual**      | Crítico - somente detecção, sem bloqueio; ataques sofisticados conseguem contorná-la                                                                   |
| **Recomendações**       | Validação da saída e confirmação do usuário para ações sensíveis, em camadas sobre a detecção existente                                                |

#### T-EXEC-002: Injeção indireta de prompt

| Atributo                | Valor                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0051.001 - Injeção de prompt em LLM: indireta                                                                              |
| **Descrição**           | O invasor incorpora instruções maliciosas ao conteúdo obtido                                                                    |
| **Vetor de ataque**     | URLs maliciosas, emails adulterados, webhooks comprometidos                                                                     |
| **Componentes afetados** | `web_fetch`, ingestão de emails, fontes de dados externas                                                                       |
| **Mitigações atuais**   | Encapsulamento de conteúdo com marcadores no estilo XML de limite aleatório, normalização de homoglifos/tokens especiais e um aviso de segurança |
| **Risco residual**      | Alto - o LLM ainda pode ignorar as instruções do encapsulamento                                                                 |
| **Recomendações**       | Contextos de execução separados para conteúdo encapsulado                                                                       |

#### T-EXEC-003: Injeção de argumentos de ferramenta

| Atributo                | Valor                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0051.000 - Injeção de prompt em LLM: direta                    |
| **Descrição**           | O invasor manipula argumentos de ferramentas por meio de injeção de prompt |
| **Vetor de ataque**     | Prompts elaborados que influenciam os valores dos parâmetros da ferramenta |
| **Componentes afetados** | Todas as invocações de ferramentas                                 |
| **Mitigações atuais**   | Aprovações de execução para comandos perigosos                      |
| **Risco residual**      | Alto - depende do julgamento do usuário                             |
| **Recomendações**       | Validação de argumentos, chamadas de ferramentas parametrizadas     |

#### T-EXEC-004: Evasão da aprovação de execução

| Atributo                | Valor                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Elaborar dados adversariais                                                                                                                                                      |
| **Descrição**           | O invasor elabora comandos que contornam a lista de permissões de aprovação                                                                                                                 |
| **Vetor de ataque**     | Ofuscação de comandos, exploração de aliases, manipulação de caminhos                                                                                                                       |
| **Componentes afetados** | `src/infra/exec-approvals*.ts`, lista de permissões de comandos                                                                                                                             |
| **Mitigações atuais**   | Lista de permissões + modo de consulta, além de normalização de comandos (remoção de encapsulamento de dispatch-wrapper, detecção de avaliação inline, análise de encadeamento de shell)     |
| **Risco residual**      | Alto - a normalização reduz, mas não elimina, a evasão por ofuscação; constatações apenas de paridade entre caminhos de execução são tratadas como reforço de segurança, não como vulnerabilidades (consulte `SECURITY.md`) |
| **Recomendações**       | Continuar expandindo a cobertura de normalização de comandos contra novas técnicas de ofuscação                                                                                             |

---

### 3.4 Persistência (AML.TA0006)

#### T-PERSIST-001: Instalação de skill maliciosa

| Atributo                | Valor                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Comprometimento da cadeia de suprimentos: software de IA                                                           |
| **Descrição**           | O invasor publica uma skill maliciosa no ClawHub                                                                                   |
| **Vetor de ataque**     | Criar uma conta, publicar uma skill com código malicioso oculto                                                                    |
| **Componentes afetados** | ClawHub, carregamento de skills, execução do agente                                                                                |
| **Mitigações atuais**   | Verificação da idade da conta do GitHub, varredura estática de padrões/adjacente à AST, análise agêntica de riscos baseada em LLM, varredura do VirusTotal |
| **Risco residual**      | Alto - existem camadas de detecção, mas as skills ainda são executadas com privilégios do agente e sem isolamento de execução      |
| **Recomendações**       | Isolamento da execução de skills, ampliação da revisão pela comunidade                                                             |

#### T-PERSIST-002: Envenenamento de atualização de skill

| Atributo                | Valor                                                                             |
| ----------------------- | --------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.001 - Comprometimento da cadeia de suprimentos: software de IA          |
| **Descrição**           | O invasor compromete uma skill popular e envia uma atualização maliciosa          |
| **Vetor de ataque**     | Comprometimento de conta, engenharia social contra o proprietário da skill        |
| **Componentes afetados** | Versionamento do ClawHub, fluxos de atualização automática                       |
| **Mitigações atuais**   | Impressão digital de versão, nova execução da moderação/varredura em novas versões |
| **Risco residual**      | Alto - as atualizações automáticas podem obter versões maliciosas antes da conclusão da revisão |
| **Recomendações**       | Assinatura de atualizações, capacidade de reversão, fixação de versão              |

#### T-PERSIST-003: Adulteração da configuração do agente

| Atributo                | Valor                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0010.002 - Comprometimento da cadeia de suprimentos: dados                                                                                              |
| **Descrição**           | O invasor modifica a configuração do agente para manter o acesso                                                                                             |
| **Vetor de ataque**     | Modificação do arquivo de configuração, injeção de configurações                                                                                             |
| **Componentes afetados** | Configuração do agente, políticas de ferramentas                                                                                                            |
| **Mitigações atuais**   | Permissões de arquivo                                                                                                                                       |
| **Risco residual**      | Médio - requer acesso local                                                                                                                                 |
| **Recomendações**       | Verificação da integridade da configuração, registro de auditoria para alterações na configuração                                                           |

---

### 3.5 Evasão de defesas (AML.TA0007)

#### T-EVADE-001: Contorno de padrões de moderação

| Atributo                | Valor                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Criar dados adversariais                                                                                         |
| **Descrição**           | O invasor cria conteúdo de Skills para evitar as verificações de moderação do ClawHub                                        |
| **Vetor de ataque**     | Homoglifos Unicode, truques de codificação, carregamento dinâmico                                                            |
| **Componentes afetados** | Pipeline de moderação/verificação do ClawHub                                                                                |
| **Mitigações atuais**   | Regras de padrões estáticos, verificação de código próxima à AST, análise de risco agêntico por LLM, VirusTotal              |
| **Risco residual**      | Médio - novas técnicas de ofuscação ainda podem passar despercebidas pelas heurísticas em camadas                            |
| **Recomendações**       | Continuar expandindo o corpus de padrões/comportamentos à medida que novas técnicas de evasão forem encontradas              |

#### T-EVADE-002: Escape do encapsulamento de conteúdo

| Atributo                | Valor                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0043 - Criar dados adversariais                                                                                                                            |
| **Descrição**           | O invasor cria conteúdo que escapa do contexto do encapsulamento de conteúdo externo                                                                            |
| **Vetor de ataque**     | Manipulação de tags, confusão de contexto, substituição de instruções                                                                                            |
| **Componentes afetados** | Encapsulamento de conteúdo externo                                                                                                                              |
| **Mitigações atuais**   | Marcadores no estilo XML com limites aleatórios + aviso de segurança, além de detecção de falsificação de marcadores por homoglifos/variantes de espaços em branco |
| **Risco residual**      | Médio - novos métodos de escape são descobertos regularmente                                                                                                     |
| **Recomendações**       | Validação na saída, além do encapsulamento na entrada                                                                                                            |

---

### 3.6 Descoberta (AML.TA0008)

#### T-DISC-001: Enumeração de ferramentas

| Atributo                | Valor                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0040 - Acesso à API de inferência de modelo de IA        |
| **Descrição**           | O invasor enumera as ferramentas disponíveis por meio de prompts |
| **Vetor de ataque**     | Consultas do tipo "Quais ferramentas você tem?"              |
| **Componentes afetados** | Registro de ferramentas do agente                            |
| **Mitigações atuais**   | Nenhuma específica                                           |
| **Risco residual**      | Baixo - as ferramentas geralmente são documentadas           |
| **Recomendações**       | Considerar controles de visibilidade das ferramentas         |

#### T-DISC-002: Extração de dados da sessão

| Atributo                | Valor                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0040 - Acesso à API de inferência de modelo de IA               |
| **Descrição**           | O invasor extrai dados confidenciais do contexto da sessão           |
| **Vetor de ataque**     | Consultas como "O que discutimos?", sondagem de contexto             |
| **Componentes afetados** | Transcrições da sessão, janela de contexto                           |
| **Mitigações atuais**   | Isolamento da sessão por remetente (chave `agent:channel:peer`)      |
| **Risco residual**      | Médio - os dados da sessão são acessíveis por design                 |
| **Recomendações**       | Ocultação de dados confidenciais no contexto                         |

---

### 3.7 Coleta e exfiltração (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Roubo de dados por meio de web_fetch

| Atributo                | Valor                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **ID ATLAS**            | AML.T0009 - Coleta                                                                         |
| **Descrição**           | O invasor exfiltra dados instruindo o agente a enviá-los para uma URL externa               |
| **Vetor de ataque**     | Injeção de prompt que faz o agente enviar dados via POST para um servidor do invasor        |
| **Componentes afetados** | Ferramenta `web_fetch`                                                                     |
| **Mitigações atuais**   | Bloqueio de SSRF para redes internas/privadas (fixação de DNS + bloqueio de IP)             |
| **Risco residual**      | Alto - URLs externas arbitrárias continuam permitidas                                       |
| **Recomendações**       | Lista de URLs permitidas, reconhecimento da classificação dos dados                         |

#### T-EXFIL-002: Envio não autorizado de mensagens

| Atributo                | Valor                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Coleta                                                            |
| **Descrição**           | O invasor faz o agente enviar mensagens contendo dados confidenciais          |
| **Vetor de ataque**     | Injeção de prompt que faz o agente enviar uma mensagem ao invasor             |
| **Componentes afetados** | Ferramenta de mensagens, integrações de canais                                |
| **Mitigações atuais**   | Controle de envio de mensagens                                                |
| **Risco residual**      | Médio - o controle pode ser contornado                                        |
| **Recomendações**       | Confirmação explícita para novos destinatários                                |

#### T-EXFIL-003: Coleta de credenciais

| Atributo                | Valor                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0009 - Coleta                                                                                                                                                              |
| **Descrição**           | Uma Skill maliciosa coleta credenciais do contexto do agente                                                                                                                    |
| **Vetor de ataque**     | O código da Skill lê variáveis de ambiente e arquivos de configuração                                                                                                           |
| **Componentes afetados** | Ambiente de execução da Skill                                                                                                                                                   |
| **Mitigações atuais**   | Verificação de padrões de credenciais pelo ClawHub (segredos codificados diretamente, acesso a variáveis de ambiente de credenciais associado a envios pela rede); sem sandbox para execução de Skills em tempo de execução |
| **Risco residual**      | Crítico - as Skills são executadas com os privilégios do agente                                                                                                                 |
| **Recomendações**       | Sandbox para execução de Skills, isolamento de credenciais                                                                                                                      |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Execução não autorizada de comandos

| Atributo                | Valor                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Comprometer a integridade do modelo de IA                                                                         |
| **Descrição**           | O invasor executa comandos arbitrários no sistema do usuário                                                                  |
| **Vetor de ataque**     | Injeção de prompt combinada com o contorno da aprovação de execução                                                           |
| **Componentes afetados** | Ferramenta Bash, execução de comandos                                                                                         |
| **Mitigações atuais**   | Aprovações de execução, opção de sandbox do Docker (backend padrão de execução)                                                |
| **Risco residual**      | Crítico - a execução no host é possível quando o sandbox está desativado                                                      |
| **Recomendações**       | Melhorar a experiência do usuário na aprovação; implantações sem sandbox continuam sendo uma escolha deliberada do operador, documentada como tal |

#### T-IMPACT-002: Esgotamento de recursos (DoS)

| Atributo                | Valor                                                    |
| ----------------------- | -------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Comprometer a integridade do modelo de IA     |
| **Descrição**           | O invasor esgota os créditos da API ou os recursos computacionais |
| **Vetor de ataque**     | Inundação automatizada de mensagens, chamadas caras de ferramentas |
| **Componentes afetados** | Gateway, sessões do agente, provedor de API              |
| **Mitigações atuais**   | Nenhuma                                                  |
| **Risco residual**      | Alto - sem limitação de taxa por remetente               |
| **Recomendações**       | Limites de taxa por remetente, orçamentos de custo       |

#### T-IMPACT-003: Danos à reputação

| Atributo                | Valor                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| **ID ATLAS**            | AML.T0031 - Comprometer a integridade do modelo de IA                |
| **Descrição**           | O invasor faz o agente enviar conteúdo prejudicial/ofensivo          |
| **Vetor de ataque**     | Injeção de prompt que causa respostas inadequadas                    |
| **Componentes afetados** | Geração de saída, mensagens de canal                                 |
| **Mitigações atuais**   | Políticas de conteúdo do provedor de LLM                             |
| **Risco residual**      | Médio - os filtros do provedor são imperfeitos                       |
| **Recomendações**       | Camada de filtragem de saída, controles do usuário                   |

---

## 4. Análise da cadeia de suprimentos do ClawHub

### 4.1 Controles de segurança atuais

| Controle                              | Implementação                                                                                  | Eficácia                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Idade da conta do GitHub              | `requireGitHubAccountAge()` (mínimo de 14 dias)                                                | Média — eleva a barreira para novos invasores                            |
| Sanitização de caminhos               | `sanitizePath()`                                                                               | Alta — impede a travessia de diretórios                                  |
| Validação do tipo de arquivo          | `isTextFile()`                                                                                 | Média — apenas arquivos de texto são verificados, mas ainda são exploráveis |
| Limites de tamanho                    | Pacote total de 50MB (`MAX_PUBLISH_TOTAL_BYTES`)                                               | Alta — evita o esgotamento de recursos                                   |
| SKILL.md obrigatório                  | Readme obrigatório na publicação                                                              | Baixo valor de segurança — apenas informativo                            |
| Verificação estática + adjacente à AST | Mecanismo de padrões que abrange execução, exfiltração, coleta de credenciais, ofuscação e mais | Média-alta — abrange muitos padrões conhecidos de abuso, mas ainda se baseia em padrões |
| Análise agêntica de risco com LLM     | Veredito orientado por prompt de segurança na publicação                                       | Média-alta — detecta comportamentos que os padrões estáticos não detectam |
| Verificação pelo VirusTotal           | Integrada aos fluxos de publicação e nova verificação de Skills e versões de pacotes, condicionada à chave de API do operador | Alta quando ativada — detecção por mecanismo estático                    |
| Status de moderação                   | Campo `moderationStatus`                                                                       | Média — permite análise manual                                           |

### 4.2 Limitações da moderação

A verificação estática do ClawHub inspeciona diretamente o conteúdo do código da Skill (não apenas slug/metadados/frontmatter), abrangendo chamadas de execução perigosas, execução dinâmica de código, coleta de credenciais, padrões de exfiltração, cargas ofuscadas e muito mais. Lacunas conhecidas:

- A detecção baseada em padrões ainda pode ser contornada por ofuscação suficientemente inédita.
- A análise baseada em LLM e a verificação pelo VirusTotal dependem da ativação de chaves de API/configuração pelo operador.
- Nenhum sandbox de execução em tempo de execução isola uma Skill dos privilégios do próprio agente depois da instalação.

### 4.3 Selos

Skills e pacotes recebem selos atribuídos por moderadores: `highlighted`, `official`, `deprecated`, `redactionApproved` (somente Skills). Denúncias da comunidade (`skillReports`) e registros de auditoria (`auditLogs`) dão suporte aos fluxos de trabalho de moderação.

---

## 5. Matriz de riscos

### 5.1 Probabilidade versus impacto

| ID da ameaça  | Probabilidade | Impacto  | Nível de risco | Prioridade |
| ------------- | ------------- | -------- | -------------- | ---------- |
| T-EXEC-001    | Alta          | Crítico  | **Crítico**    | P0         |
| T-PERSIST-001 | Alta          | Crítico  | **Crítico**    | P0         |
| T-EXFIL-003   | Média         | Crítico  | **Crítico**    | P0         |
| T-IMPACT-001  | Média         | Crítico  | **Alto**       | P1         |
| T-EXEC-002    | Alta          | Alto     | **Alto**       | P1         |
| T-EXEC-004    | Média         | Alto     | **Alto**       | P1         |
| T-ACCESS-003  | Média         | Alto     | **Alto**       | P1         |
| T-EXFIL-001   | Média         | Alto     | **Alto**       | P1         |
| T-IMPACT-002  | Alta          | Médio    | **Alto**       | P1         |
| T-EVADE-001   | Alta          | Médio    | **Médio**      | P2         |
| T-ACCESS-001  | Baixa         | Alto     | **Médio**      | P2         |
| T-ACCESS-002  | Baixa         | Alto     | **Médio**      | P2         |
| T-PERSIST-002 | Baixa         | Alto     | **Médio**      | P2         |

### 5.2 Cadeias de ataque de caminho crítico

**Cadeia 1: roubo de dados baseado em Skill**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publicar Skill maliciosa) → (Evitar a moderação) → (Coletar credenciais)
```

**Cadeia 2: injeção de prompt levando à RCE**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Injetar prompt) → (Ignorar a aprovação de execução) → (Executar comandos)
```

**Cadeia 3: injeção indireta por conteúdo obtido**

```text
T-EXEC-002 → T-EXFIL-001 → Exfiltração externa
(Contaminar o conteúdo da URL) → (O agente obtém e segue as instruções) → (Os dados são enviados ao invasor)
```

---

## 6. Resumo das recomendações

### 6.1 Imediatas (P0)

| ID    | Recomendação                                           | Trata de                   |
| ----- | ------------------------------------------------------ | -------------------------- |
| R-002 | Implementar sandbox para execução de Skills            | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Adicionar validação de saída para ações confidenciais  | T-EXEC-001, T-EXEC-002     |

### 6.2 Curto prazo (P1)

| ID    | Recomendação                                                                    | Trata de     |
| ----- | ------------------------------------------------------------------------------- | ------------ |
| R-004 | Implementar limitação de taxa por remetente                                     | T-IMPACT-002 |
| R-005 | Adicionar criptografia de tokens em repouso                                     | T-ACCESS-003 |
| R-006 | Melhorar a experiência de aprovação de execução e continuar ampliando a normalização de comandos | T-EXEC-004 |
| R-007 | Implementar lista de URLs permitidas para `web_fetch`                           | T-EXFIL-001  |

### 6.3 Médio prazo (P2)

| ID    | Recomendação                                                      | Trata de      |
| ----- | ----------------------------------------------------------------- | ------------- |
| R-008 | Adicionar verificação criptográfica de canais quando possível     | T-ACCESS-002  |
| R-009 | Implementar verificação de integridade da configuração            | T-PERSIST-003 |
| R-010 | Adicionar assinatura de atualizações e fixação de versão          | T-PERSIST-002 |

---

## 7. Apêndices

### 7.1 Mapeamento de técnicas do ATLAS

| ID do ATLAS   | Nome da técnica                              | Ameaças ao OpenClaw                                               |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| AML.T0006     | Varredura ativa                              | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Coleta                                       | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Cadeia de suprimentos: software de IA        | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Cadeia de suprimentos: dados                 | T-PERSIST-003                                                    |
| AML.T0031     | Comprometimento da integridade do modelo de IA | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                       |
| AML.T0040     | Acesso à API de inferência de modelo de IA   | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Criação de dados adversariais                | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Injeção de prompt em LLM: direta             | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Injeção de prompt em LLM: indireta           | T-EXEC-002                                                       |

### 7.2 Principais arquivos de segurança

| Caminho                             | Finalidade                                      | Nível de risco |
| ----------------------------------- | ----------------------------------------------- | -------------- |
| `src/infra/exec-approvals.ts`       | Lógica de aprovação de comandos                 | **Crítico**    |
| `src/gateway/auth.ts`               | Autenticação do Gateway                         | **Crítico**    |
| `src/infra/net/ssrf.ts`             | Proteção contra SSRF                            | **Crítico**    |
| `src/security/external-content.ts`  | Mitigação de injeção de prompt                  | **Crítico**    |
| `src/agents/sandbox/tool-policy.ts` | Política de permissão/bloqueio de ferramentas do sandbox | **Crítico** |
| `src/routing/resolve-route.ts`      | Isolamento de sessão/roteamento                 | **Médio**      |

### 7.3 Glossário

| Termo                  | Definição                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| **ATLAS**              | Panorama de ameaças adversariais para sistemas de IA da MITRE    |
| **ClawHub**            | Marketplace de Skills do OpenClaw                                |
| **Gateway**            | Camada de roteamento de mensagens e autenticação do OpenClaw     |
| **MCP**                | Protocolo de Contexto de Modelo — interface de provedor de ferramentas |
| **Injeção de prompt**  | Ataque no qual instruções maliciosas são incorporadas à entrada  |
| **Skill**              | Extensão para agentes do OpenClaw disponível para download       |
| **SSRF**               | Falsificação de Solicitação do Lado do Servidor                  |

---

_Este modelo de ameaças é um documento em constante evolução. Relate problemas de segurança para `security@openclaw.ai` ou consulte a [página de confiança](https://trust.openclaw.ai)._

## Relacionados

- [Como contribuir para o modelo de ameaças](/pt-BR/security/CONTRIBUTING-THREAT-MODEL)
- [Resposta a incidentes](/pt-BR/security/incident-response)
- [Proxy de rede](/pt-BR/security/network-proxy)
- [Verificação formal](/pt-BR/security/formal-verification)
