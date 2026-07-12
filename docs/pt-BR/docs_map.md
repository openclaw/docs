---
read_when: Finding which docs page covers a topic before reading the page
summary: Mapa de títulos gerado para as páginas da documentação do OpenClaw
title: Mapa da documentação
x-i18n:
    generated_at: "2026-07-12T15:08:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 691c999d749d88c4c350c4b6dd197a57418dd915587a73e1bbeb6d54b45061de
    source_path: docs_map.md
    workflow: 16
---

# Mapa da documentação do OpenClaw

Este arquivo é gerado a partir dos títulos de `docs/**/*.md` e `docs/**/*.mdx` para ajudar os agentes a navegar pela árvore da documentação.
Não o edite manualmente; execute `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Rota: /agent-runtime-architecture
- Títulos:
  - H2: Estrutura do runtime
  - H2: Limites
  - H2: Manifestos
  - H2: Seleção do runtime
  - H2: Relacionados

## announcements/bluebubbles-imessage.md

- Rota: /announcements/bluebubbles-imessage
- Títulos:
  - H1: Remoção do BlueBubbles e o caminho do iMessage com imsg
  - H2: O que mudou
  - H2: O que fazer
  - H2: Notas de migração
  - H2: Veja também

## auth-credential-semantics.md

- Rota: /auth-credential-semantics
- Títulos:
  - H2: Códigos de motivo estáveis para sondagem
  - H2: Credenciais de token
  - H3: Regras de qualificação
  - H3: Regras de resolução
  - H2: Portabilidade da cópia do agente
  - H2: Rotas de autenticação somente por configuração
  - H2: Filtragem explícita da ordem de autenticação
  - H2: Resolução do destino da sondagem
  - H2: Descoberta de credenciais de CLI externa
  - H2: Proteção da política de SecretRef do OAuth
  - H2: Mensagens compatíveis com versões legadas
  - H2: Relacionados

## automation/auth-monitoring.md

- Rota: /automation/auth-monitoring
- Títulos:
  - H2: Relacionados

## automation/clawflow.md

- Rota: /automation/clawflow
- Títulos:
  - H2: Relacionados

## automation/cron-jobs.md

- Rota: /automation/cron-jobs
- Títulos:
  - H2: Início rápido
  - H2: Como o Cron funciona
  - H2: Tipos de agendamento
  - H3: Dia do mês e dia da semana usam lógica OU
  - H2: Gatilhos de eventos (observadores de condições)
  - H2: Payloads
  - H3: Opções de turno do agente
  - H3: Payloads de comandos
  - H2: Estilos de execução
  - H2: Entrega e saída
  - H3: Notificações de falha
  - H3: Idioma da saída
  - H2: Exemplos de CLI
  - H2: Gerenciamento de tarefas
  - H2: Webhooks
  - H3: Autenticação
  - H2: Integração com o Gmail PubSub
  - H3: Configuração pelo assistente (recomendado)
  - H3: Inicialização automática do Gateway
  - H3: Configuração manual única
  - H3: Substituição do modelo do Gmail
  - H2: Configuração
  - H2: Solução de problemas
  - H3: Sequência de comandos
  - H2: Relacionados

## automation/cron-vs-heartbeat.md

- Rota: /automation/cron-vs-heartbeat
- Títulos:
  - H2: Relacionados

## automation/gmail-pubsub.md

- Rota: /automation/gmail-pubsub
- Títulos:
  - H2: Relacionados

## automation/hooks.md

- Rota: /automation/hooks
- Títulos:
  - H2: Escolha a interface correta
  - H2: Início rápido
  - H2: Tipos de eventos
  - H2: Como escrever hooks
  - H3: Estrutura de hooks
  - H3: Formato de HOOK.md
  - H3: Implementação do handler
  - H3: Destaques do contexto do evento
  - H2: Descoberta de hooks
  - H3: Pacotes de hooks
  - H2: Hooks incluídos
  - H3: Detalhes de session-memory
  - H3: Configuração de bootstrap-extra-files
  - H3: Detalhes de command-logger
  - H3: Detalhes de compaction-notifier
  - H3: Detalhes de boot-md
  - H2: Hooks de Plugin
  - H2: Configuração
  - H2: Referência da CLI
  - H2: Práticas recomendadas
  - H2: Solução de problemas
  - H3: Hook não descoberto
  - H3: Hook não qualificado
  - H3: Hook não executado
  - H2: Relacionados

## automation/index.md

- Rota: /automation
- Títulos:
  - H2: Guia rápido de decisão
  - H3: Tarefas agendadas (Cron) versus Heartbeat
  - H2: Conceitos fundamentais
  - H3: Tarefas agendadas (Cron)
  - H3: Tarefas
  - H3: Compromissos inferidos
  - H3: Fluxo de tarefas
  - H3: Ordens permanentes
  - H3: Hooks
  - H3: Heartbeat
  - H2: Como funcionam em conjunto
  - H2: Relacionados

## automation/poll.md

- Rota: /automation/poll
- Títulos:
  - H2: Relacionados

## automation/standing-orders.md

- Rota: /automation/standing-orders
- Títulos:
  - H2: Por que usar ordens permanentes
  - H2: Como funcionam
  - H2: Anatomia de uma ordem permanente
  - H2: Ordens permanentes com tarefas Cron
  - H2: Exemplos
  - H3: Exemplo 1: conteúdo e redes sociais (ciclo semanal)
  - H3: Exemplo 2: operações financeiras (acionadas por evento)
  - H3: Exemplo 3: monitoramento e alertas (contínuos)
  - H2: Padrão executar-verificar-relatar
  - H2: Arquitetura multiprograma
  - H2: Práticas recomendadas
  - H3: Faça
  - H3: Evite
  - H2: Relacionados

## automation/taskflow.md

- Rota: /automation/taskflow
- Títulos:
  - H2: Quando usar o fluxo de tarefas
  - H2: Modos de sincronização
  - H3: Modo gerenciado
  - H3: Modo espelhado
  - H2: Status do fluxo
  - H2: Estado durável e acompanhamento de revisões
  - H2: Comportamento de cancelamento
  - H2: Comandos da CLI
  - H2: Padrão confiável de fluxo de trabalho agendado
  - H2: Como os fluxos se relacionam às tarefas
  - H2: Relacionados

## automation/tasks.md

- Rota: /automation/tasks
- Títulos:
  - H2: Resumo
  - H2: Início rápido
  - H2: O que cria uma tarefa
  - H2: Ciclo de vida da tarefa
  - H2: Entrega e notificações
  - H3: Políticas de notificação
  - H2: Referência da CLI
  - H2: Quadro de tarefas do chat (/tasks)
  - H3: Interface de controle
  - H2: Integração de status (pressão de tarefas)
  - H2: Armazenamento e manutenção
  - H3: Onde as tarefas ficam armazenadas
  - H3: Manutenção automática
  - H2: Como as tarefas se relacionam a outros sistemas
  - H2: Relacionados

## automation/troubleshooting.md

- Rota: /automation/troubleshooting
- Títulos:
  - H2: Relacionados

## automation/webhook.md

- Rota: /automation/webhook
- Títulos:
  - H2: Relacionados

## brave-search.md

- Rota: /brave-search
- Títulos:
  - H2: Relacionados

## channels/access-groups.md

- Rota: /channels/access-groups
- Títulos:
  - H2: Grupos estáticos de remetentes de mensagens
  - H2: Grupos de referência de listas de permissões
  - H2: Caminhos compatíveis de canais de mensagens
  - H2: Públicos de canais do Discord
  - H2: Diagnósticos de Plugin
  - H2: Notas de segurança
  - H2: Solução de problemas

## channels/ambient-room-events.md

- Rota: /channels/ambient-room-events
- Títulos:
  - H2: Configuração recomendada
  - H2: O que muda
  - H2: Exemplo do Discord
  - H2: Exemplo do Slack
  - H2: Exemplo do Telegram
  - H2: Política específica do agente
  - H2: Modos de resposta visível
  - H2: Histórico
  - H2: Solução de problemas
  - H2: Relacionados

## channels/bot-loop-protection.md

- Rota: /channels/bot-loop-protection
- Títulos:
  - H2: Padrões
  - H2: Configurar padrões compartilhados
  - H2: Substituir por canal, conta ou sala
  - H2: Compatibilidade de canais

## channels/broadcast-groups.md

- Rota: /channels/broadcast-groups
- Títulos:
  - H2: Visão geral
  - H2: Configuração
  - H3: Configuração básica
  - H3: Estratégia de processamento
  - H3: Exemplo completo
  - H2: Como funciona
  - H3: Fluxo de mensagens
  - H3: Isolamento de sessões
  - H3: Exemplo: sessões isoladas
  - H2: Casos de uso
  - H2: Práticas recomendadas
  - H2: Compatibilidade
  - H3: Provedores
  - H3: Roteamento
  - H2: Solução de problemas
  - H2: Exemplos
  - H2: Referência da API
  - H3: Esquema de configuração
  - H3: Campos
  - H2: Limitações
  - H2: Relacionados

## channels/channel-routing.md

- Rota: /channels/channel-routing
- Títulos:
  - H1: Canais e roteamento
  - H2: Termos principais
  - H2: Prefixos de destinos de saída
  - H2: Formatos de chaves de sessão (exemplos)
  - H2: Fixação da rota principal de mensagem direta
  - H2: Registro protegido de mensagens recebidas
  - H2: Regras de roteamento (como um agente é escolhido)
  - H2: Grupos de transmissão (executar vários agentes)
  - H2: Visão geral da configuração
  - H2: Armazenamento de sessões
  - H2: Comportamento do WebChat
  - H2: Contexto da resposta
  - H2: Relacionados

## channels/clickclack.md

- Rota: /channels/clickclack
- Títulos:
  - H2: Configuração rápida
  - H3: Chaves de configuração da conta
  - H2: Vários bots
  - H2: Modos de resposta
  - H2: Linhas de atividade do agente
  - H2: Destinos
  - H2: Permissões
  - H2: Solução de problemas

## channels/discord.md

- Rota: /channels/discord
- Títulos:
  - H2: Configuração rápida
  - H2: Recomendado: configure um espaço de trabalho de servidor
  - H2: Modelo de runtime
  - H2: Canais de fórum
  - H2: Componentes interativos
  - H2: Controle de acesso e roteamento
  - H3: Roteamento de agentes baseado em funções
  - H2: Comandos nativos e autenticação de comandos
  - H2: Detalhes dos recursos
  - H2: Ferramentas e controles de ações
  - H2: Interface de componentes v2
  - H2: Voz
  - H3: Canais de voz
  - H3: Seguir usuários por voz
  - H3: Mensagens de voz
  - H2: Solução de problemas
  - H2: Referência de configuração
  - H2: Segurança e operações
  - H2: Relacionados

## channels/feishu.md

- Rota: /channels/feishu
- Títulos:
  - H2: Início rápido
  - H2: Controle de acesso
  - H3: Mensagens diretas
  - H3: Conversas em grupo
  - H2: Exemplos de configuração de grupos
  - H3: Permitir todos os grupos, sem exigir @menção
  - H3: Permitir todos os grupos, ainda exigindo @menção
  - H3: Permitir somente grupos específicos
  - H3: Restringir remetentes em um grupo
  - H2: Obter IDs de grupos/usuários
  - H3: IDs de grupos (chatid, formato: ocxxx)
  - H3: IDs de usuários (openid, formato: ouxxx)
  - H2: Comandos comuns
  - H2: Solução de problemas
  - H3: O bot não responde em conversas em grupo
  - H3: O bot não recebe mensagens
  - H3: A configuração por QR não responde no aplicativo móvel do Feishu
  - H3: App Secret vazado
  - H2: Configuração avançada
  - H3: Várias contas
  - H3: Limites de mensagens
  - H3: Streaming
  - H3: Otimização de cota
  - H3: Escopo da sessão de grupo e threads de tópicos
  - H3: Ferramentas do espaço de trabalho do Feishu
  - H3: Sessões ACP
  - H4: Vinculação persistente de ACP
  - H4: Iniciar ACP pelo chat
  - H3: Roteamento multiagente
  - H2: Isolamento de agentes por usuário (criação dinâmica de agentes)
  - H3: Configuração rápida
  - H3: Como funciona
  - H3: Opções de configuração
  - H3: Escopo da sessão
  - H3: Implantação multiusuário típica
  - H3: Verificação
  - H3: Notas
  - H2: Referência de configuração
  - H2: Tipos de mensagens compatíveis
  - H3: Receber
  - H3: Enviar
  - H3: Threads e respostas
  - H2: Relacionados

## channels/googlechat.md

- Rota: /channels/googlechat
- Títulos:
  - H2: Instalação
  - H2: Configuração rápida (iniciante)
  - H2: Adicionar ao Google Chat
  - H2: URL pública (somente Webhook)
  - H3: Opção A: Tailscale Funnel (recomendado)
  - H3: Opção B: proxy reverso (Caddy)
  - H3: Opção C: Cloudflare Tunnel
  - H2: Como funciona
  - H2: Destinos
  - H2: Destaques da configuração
  - H2: Solução de problemas
  - H3: 405 Method Not Allowed
  - H3: Outros problemas
  - H2: Relacionados

## channels/group-messages.md

- Rota: /channels/group-messages
- Títulos:
  - H2: Comportamento
  - H2: Exemplo de configuração (WhatsApp)
  - H3: Comando de ativação (somente proprietário)
  - H2: Como usar
  - H2: Testes/verificação
  - H2: Considerações conhecidas
  - H2: Relacionados

## channels/groups.md

- Rota: /channels/groups
- Títulos:
  - H2: Introdução para iniciantes (2 minutos)
  - H2: Respostas visíveis
  - H2: Visibilidade do contexto e listas de permissões
  - H2: Chaves de sessão
  - H2: Padrão: mensagens diretas pessoais + grupos públicos (um único agente)
  - H2: Rótulos de exibição
  - H2: Política de grupos
  - H2: Controle por menção (padrão)
  - H2: Definir o escopo dos padrões de menção configurados
  - H2: Restrições de ferramentas por grupo/canal (opcional)
  - H2: Listas de permissões de grupos
  - H2: Ativação (somente proprietário)
  - H2: Campos de contexto
  - H2: Especificidades do iMessage
  - H2: Prompts de sistema do WhatsApp
  - H2: Especificidades do WhatsApp
  - H2: Relacionados

## channels/imessage-from-bluebubbles.md

- Rota: /channels/imessage-from-bluebubbles
- Títulos:
  - H2: Lista de verificação da migração
  - H2: O que o imsg faz
  - H2: Antes de começar
  - H2: Tradução da configuração
  - H2: Armadilha do registro de grupos
  - H2: Passo a passo
  - H2: Visão geral da equivalência de ações
  - H2: Emparelhamento, sessões e vinculações ACP
  - H2: Nenhum canal de reversão
  - H2: Relacionados

## channels/imessage.md

- Rota: /channels/imessage
- Títulos:
  - H2: Configuração rápida
  - H2: Requisitos e permissões (macOS)
  - H2: Ativação da API privada do imsg
  - H3: Configuração
  - H3: Quando o SIP permanece ativado
  - H2: Controle de acesso e roteamento
  - H2: Vinculações de conversas ACP
  - H2: Padrões de implantação
  - H2: Mídia, divisão em partes e destinos de entrega
  - H2: Ações da API privada
  - H2: Gravações de configuração
  - H2: Agrupamento de mensagens diretas enviadas separadamente (comando + URL em uma composição)
  - H3: Cenários e o que o agente vê
  - H2: Recuperação de mensagens recebidas após a reinicialização de uma ponte ou do Gateway
  - H3: Sinal visível para o operador
  - H3: Migração
  - H2: Solução de problemas
  - H2: Referências de configuração
  - H2: Relacionados

## channels/index.md

- Rota: /channels
- Títulos:
  - H2: Canais compatíveis
  - H2: Notas de entrega
  - H2: Notas

## channels/irc.md

- Rota: /channels/irc
- Títulos:
  - H2: Início rápido
  - H2: Configurações de conexão
  - H2: Padrões de segurança
  - H2: Controle de acesso
  - H3: Armadilha comum: allowFrom se aplica a mensagens diretas, não a canais
  - H2: Acionamento de respostas (menções)
  - H2: Nota de segurança (recomendado para canais públicos)
  - H3: As mesmas ferramentas para todos no canal
  - H3: Ferramentas diferentes por remetente (o proprietário tem mais poder)
  - H2: NickServ
  - H2: Variáveis de ambiente
  - H2: Solução de problemas
  - H2: Relacionados

## channels/line.md

- Rota: /channels/line
- Títulos:
  - H2: Instalação
  - H2: Configuração
  - H2: Configurar
  - H2: Controle de acesso
  - H2: Comportamento das mensagens
  - H2: Dados do canal (mensagens avançadas)
  - H2: Suporte a ACP
  - H2: Mídia de saída
  - H2: Solução de problemas
  - H2: Relacionados

## channels/location.md

- Rota: /channels/location
- Títulos:
  - H2: Formatação de texto
  - H2: Campos de contexto
  - H2: Cargas úteis de saída
  - H2: Observações sobre o canal
  - H2: Relacionados

## channels/matrix-migration.md

- Rota: /channels/matrix-migration
- Títulos:
  - H2: O que a migração faz automaticamente
  - H2: Atualização de versões do OpenClaw anteriores à 2026.4
  - H2: Fluxo de atualização recomendado
  - H2: Mensagens comuns e o que elas significam
  - H3: Mensagens de recuperação manual
  - H2: Se o histórico criptografado ainda não for restaurado
  - H2: Se você quiser recomeçar para mensagens futuras
  - H2: Relacionados

## channels/matrix-presentation.md

- Rota: /channels/matrix-presentation
- Títulos:
  - H2: Conteúdo do evento
  - H2: Comportamento de contingência
  - H2: Blocos compatíveis
  - H2: Interações
  - H2: Relação com os metadados de aprovação
  - H2: Mensagens de mídia

## channels/matrix-push-rules.md

- Rota: /channels/matrix-push-rules
- Títulos:
  - H2: Pré-requisitos
  - H2: Etapas
  - H2: Observações sobre múltiplos bots
  - H2: Observações sobre o homeserver
  - H2: Relacionados

## channels/matrix.md

- Rota: /channels/matrix
- Títulos:
  - H2: Instalação
  - H2: Configuração
  - H3: Configuração interativa
  - H3: Configuração mínima
  - H3: Entrada automática
  - H3: Formatos de destino da lista de permissões
  - H3: Normalização do ID da conta
  - H3: Credenciais em cache
  - H3: Variáveis de ambiente
  - H2: Exemplo de configuração
  - H2: Prévias por streaming
  - H2: Mensagens de voz
  - H2: Metadados de aprovação
  - H3: Regras de push auto-hospedadas para prévias finalizadas sem notificações
  - H2: Salas entre bots
  - H2: Criptografia e verificação
  - H3: Ativar a criptografia
  - H3: Indicadores de status e confiança
  - H3: Verificar este dispositivo com uma chave de recuperação
  - H3: Inicializar ou reparar a assinatura cruzada
  - H3: Backup das chaves de sala
  - H3: Listar, solicitar e responder a verificações
  - H3: Observações sobre múltiplas contas
  - H2: Gerenciamento de perfil
  - H2: Threads
  - H3: Roteamento de sessões (sessionScope)
  - H3: Respostas em threads (threadReplies)
  - H3: Herança de threads e comandos de barra
  - H2: Vínculos de conversas ACP
  - H3: Configuração de vínculo de threads
  - H2: Reações
  - H2: Contexto do histórico
  - H2: Visibilidade do contexto
  - H2: Política de mensagens diretas e salas
  - H2: Reparo de salas diretas
  - H2: Aprovações de execução
  - H2: Comandos de barra
  - H2: Múltiplas contas
  - H2: Homeservers privados/LAN
  - H2: Uso de proxy para o tráfego do Matrix
  - H2: Resolução de destino
  - H2: Referência de configuração
  - H3: Conta e conexão
  - H3: Criptografia
  - H3: Acesso e política
  - H3: Comportamento das respostas
  - H3: Configurações de reações
  - H3: Ferramentas e substituições por sala
  - H3: Configurações de aprovação de execução
  - H2: Relacionados

## channels/mattermost.md

- Rota: /channels/mattermost
- Títulos:
  - H2: Instalação
  - H2: Configuração rápida
  - H2: Comandos de barra nativos
  - H2: Variáveis de ambiente (conta padrão)
  - H2: Modos de conversa
  - H2: Threads e sessões
  - H2: Controle de acesso (mensagens diretas)
  - H2: Canais (grupos)
  - H2: Destinos para entrega de saída
  - H2: Nova tentativa do canal de mensagens diretas
  - H2: Streaming de prévias
  - H2: Reações (ferramenta de mensagens)
  - H2: Botões interativos (ferramenta de mensagens)
  - H3: Integração direta com a API (scripts externos)
  - H2: Adaptador de diretório
  - H2: Múltiplas contas
  - H2: Solução de problemas
  - H2: Relacionados

## channels/msteams.md

- Rota: /channels/msteams
- Títulos:
  - H2: Plugin incluído
  - H2: Configuração rápida
  - H2: Objetivos
  - H2: Gravações de configuração
  - H2: Controle de acesso (mensagens diretas + grupos)
  - H3: Como funciona
  - H3: Etapa 1: Criar o Azure Bot
  - H3: Etapa 2: Obter credenciais
  - H3: Etapa 3: Configurar o endpoint de mensagens
  - H3: Etapa 4: Ativar o canal do Teams
  - H3: Etapa 5: Criar o manifesto do aplicativo do Teams
  - H3: Etapa 6: Configurar o OpenClaw
  - H3: Etapa 7: Executar o Gateway
  - H2: Autenticação federada (certificado e identidade gerenciada)
  - H3: Opção A: Autenticação baseada em certificado
  - H3: Opção B: Azure Managed Identity
  - H3: Configuração da AKS Workload Identity
  - H3: Comparação dos tipos de autenticação
  - H2: Desenvolvimento local (tunelamento)
  - H2: Teste do bot
  - H2: Variáveis de ambiente
  - H2: Ação de informações do membro
  - H2: Contexto do histórico
  - H2: Permissões RSC atuais do Teams (manifesto)
  - H2: Exemplo de manifesto do Teams (com dados suprimidos)
  - H3: Ressalvas do manifesto (campos obrigatórios)
  - H3: Atualização de um aplicativo existente
  - H2: Recursos: somente RSC versus Graph
  - H3: Somente com RSC do Teams (aplicativo instalado, sem permissões da API Graph)
  - H3: Com RSC do Teams + permissões de aplicativo do Microsoft Graph
  - H3: RSC versus API Graph
  - H2: Mídia + histórico habilitados pelo Graph
  - H3: Recuperação de arquivos de canais/grupos (graphMediaFallback)
  - H2: Limitações conhecidas
  - H3: Tempos limite do Webhook
  - H3: Suporte à nuvem do Teams e à URL do serviço
  - H3: Formatação
  - H2: Configuração
  - H2: Roteamento e sessões
  - H2: Estilo de resposta: threads versus publicações
  - H3: Precedência de resolução
  - H3: Preservação do contexto da thread
  - H2: Anexos e imagens
  - H2: Envio de arquivos em conversas em grupo
  - H3: Por que conversas em grupo precisam do SharePoint
  - H3: Configuração
  - H3: Comportamento de compartilhamento
  - H3: Comportamento de contingência
  - H3: Local de armazenamento dos arquivos
  - H2: Enquetes (Adaptive Cards)
  - H2: Cartões de apresentação
  - H2: Formatos de destino
  - H2: Mensagens proativas
  - H2: IDs de equipe e canal (armadilha comum)
  - H2: Canais privados
  - H2: Solução de problemas
  - H3: Problemas comuns
  - H3: Erros no envio do manifesto
  - H3: Permissões RSC não funcionam
  - H2: Referências
  - H2: Relacionados

## channels/nextcloud-talk.md

- Rota: /channels/nextcloud-talk
- Títulos:
  - H2: Instalação
  - H2: Configuração rápida (iniciante)
  - H2: Observações
  - H2: Controle de acesso (mensagens diretas)
  - H2: Salas (grupos)
  - H2: Recursos
  - H2: Referência de configuração (Nextcloud Talk)
  - H2: Relacionados

## channels/nostr.md

- Rota: /channels/nostr
- Títulos:
  - H2: Instalação
  - H3: Configuração não interativa
  - H2: Configuração rápida
  - H2: Referência de configuração
  - H2: Metadados do perfil
  - H2: Controle de acesso
  - H3: Políticas de mensagens diretas
  - H3: Exemplo de lista de permissões
  - H2: Formatos de chave
  - H2: Relés
  - H2: Suporte ao protocolo
  - H2: Testes
  - H3: Relé local
  - H3: Teste manual
  - H2: Solução de problemas
  - H3: Mensagens não são recebidas
  - H3: Respostas não são enviadas
  - H3: Respostas duplicadas
  - H2: Segurança
  - H2: Limitações (MVP)
  - H2: Relacionados

## channels/pairing.md

- Rota: /channels/pairing
- Títulos:
  - H2: 1) Pareamento de mensagens diretas (acesso a conversas de entrada)
  - H3: Aprovar um remetente
  - H3: Grupos reutilizáveis de remetentes
  - H3: Onde o estado fica armazenado
  - H2: 2) Pareamento de dispositivos Node (nodes iOS/Android/macOS/sem interface)
  - H3: Parear pela interface de controle (recomendado)
  - H3: Parear pelo Telegram
  - H3: Aprovar um dispositivo Node
  - H3: Aprovação automática opcional de nodes em CIDRs confiáveis
  - H3: Armazenamento do estado de pareamento de Node
  - H3: Observações
  - H2: Documentação relacionada

## channels/qa-channel.md

- Rota: /channels/qa-channel
- Títulos:
  - H2: O que faz
  - H2: Configuração
  - H2: Executores
  - H2: Relacionados

## channels/qqbot.md

- Rota: /channels/qqbot
- Títulos:
  - H2: Instalação
  - H2: Configuração
  - H2: Configurar
  - H3: Política de acesso
  - H3: Configuração de múltiplas contas
  - H3: Conversas em grupo
  - H3: Voz (STT/TTS)
  - H2: Formatos de destino
  - H2: Comandos de barra
  - H2: Mídia e armazenamento
  - H2: Solução de problemas
  - H2: Relacionados

## channels/raft.md

- Rota: /channels/raft
- Títulos:
  - H2: Instalação
  - H2: Pré-requisitos
  - H2: Configurar
  - H2: Como funciona
  - H2: Verificar
  - H2: Solução de problemas
  - H2: Referências

## channels/signal.md

- Rota: /channels/signal
- Títulos:
  - H2: O modelo de números (leia isto primeiro)
  - H2: Instalação
  - H2: Configuração rápida
  - H2: O que é
  - H2: Caminho de configuração A: vincular uma conta existente do Signal (QR)
  - H2: Caminho de configuração B: registrar um número dedicado para o bot (SMS, Linux)
  - H2: Modo de daemon externo (httpUrl)
  - H2: Modo de contêiner (bbernhard/signal-cli-rest-api)
  - H2: Controle de acesso (mensagens diretas + grupos)
  - H2: Como funciona (comportamento)
  - H2: Mídia + limites
  - H2: Indicadores de digitação + confirmações de leitura
  - H2: Reações de status do ciclo de vida
  - H2: Reações (ferramenta de mensagens)
  - H2: Reações de aprovação
  - H2: Destinos de entrega (CLI/cron)
  - H2: Aliases
  - H2: Solução de problemas
  - H2: Observações de segurança
  - H2: Referência de configuração (Signal)
  - H2: Relacionados

## channels/slack.md

- Rota: /channels/slack
- Títulos:
  - H2: Escolha de um transporte
  - H3: Modo de retransmissão
  - H3: Instalações em toda a organização no Enterprise Grid
  - H4: Socket Mode
  - H4: URLs de requisição HTTP
  - H2: Instalação
  - H2: Configuração rápida
  - H2: Ajuste do transporte Socket Mode
  - H2: Lista de verificação do manifesto e dos escopos
  - H3: Configurações adicionais do manifesto
  - H2: Modelo de tokens
  - H2: Ações e controles
  - H2: Controle de acesso e roteamento
  - H2: Threads, sessões e tags de resposta
  - H2: Reações de confirmação
  - H3: Emoji (ackReaction)
  - H3: Escopo (messages.ackReactionScope)
  - H2: Streaming de texto
  - H2: Contingência de reação de digitação
  - H2: Entrada de voz
  - H2: Mídia, divisão em blocos e entrega
  - H2: Comandos e comportamento de barra
  - H2: Gráficos nativos
  - H2: Tabelas nativas
  - H2: Respostas interativas
  - H3: Envios de modais pertencentes ao Plugin
  - H2: Aprovações nativas no Slack
  - H2: Eventos e comportamento operacional
  - H2: Referência de configuração
  - H2: Solução de problemas
  - H2: Referência de mídia em anexos
  - H3: Tipos de mídia compatíveis
  - H3: Pipeline de entrada
  - H3: Herança de anexos da raiz da thread
  - H3: Tratamento de múltiplos anexos
  - H3: Limites de tamanho, download e modelo
  - H3: Limites conhecidos
  - H3: Documentação relacionada
  - H2: Relacionados

## channels/sms.md

- Rota: /channels/sms
- Títulos:
  - H2: Antes de começar
  - H2: Configuração rápida
  - H2: Exemplos de configuração
  - H3: Arquivo de configuração
  - H3: Variáveis de ambiente
  - H3: Token de autenticação SecretRef
  - H3: Remetente do Messaging Service
  - H3: Destino padrão de saída
  - H2: Controle de acesso
  - H2: Envio de SMS
  - H2: Verificar a configuração
  - H3: Teste de ponta a ponta pelo iMessage/SMS do macOS
  - H2: Segurança do Webhook
  - H2: Configuração de múltiplas contas
  - H2: Solução de problemas
  - H3: O Twilio retorna 403 ou o OpenClaw rejeita o Webhook
  - H3: Nenhuma solicitação de pareamento aparece
  - H3: Os envios de saída falham
  - H3: As mensagens chegam, mas o agente não responde

## channels/synology-chat.md

- Rota: /channels/synology-chat
- Títulos:
  - H2: Instalação
  - H2: Configuração rápida
  - H2: Variáveis de ambiente
  - H2: Política de mensagens diretas e controle de acesso
  - H2: Entrega de saída
  - H2: Múltiplas contas
  - H2: Observações de segurança
  - H2: Solução de problemas
  - H2: Relacionados

## channels/telegram.md

- Rota: /channels/telegram
- Títulos:
  - H2: Configuração rápida
  - H2: Configurações no Telegram
  - H2: Miniaplicativo do painel
  - H2: Controle de acesso e ativação
  - H3: Identidade do bot no grupo
  - H2: Comportamento em tempo de execução
  - H2: Referência de recursos
  - H2: Controles de respostas de erro
  - H2: Solução de problemas
  - H2: Referência de configuração
  - H2: Relacionados

## channels/tlon.md

- Rota: /channels/tlon
- Títulos:
  - H2: Plugin incluído
  - H2: Configuração
  - H2: Ships privados/LAN
  - H2: Canais de grupo
  - H2: Controle de acesso
  - H2: Sistema de proprietário e aprovação
  - H2: Configurações de aceitação automática
  - H2: Recarga automática pelo armazenamento de configurações do Urbit
  - H2: Destinos de entrega (CLI/cron)
  - H2: Skill incluída
  - H2: Recursos
  - H2: Solução de problemas
  - H2: Referência de configuração
  - H2: Observações
  - H2: Relacionados

## channels/troubleshooting.md

- Rota: /channels/troubleshooting
- Títulos:
  - H2: Sequência de comandos
  - H2: Após uma atualização
  - H2: WhatsApp
  - H3: Indícios de falha do WhatsApp
  - H2: Telegram
  - H3: Indícios de falha do Telegram
  - H2: Discord
  - H3: Indícios de falha do Discord
  - H2: Slack
  - H3: Indícios de falha do Slack
  - H2: iMessage
  - H3: Indícios de falha do iMessage
  - H2: Signal
  - H3: Indícios de falha do Signal
  - H2: QQ Bot
  - H3: Indícios de falha do QQ Bot
  - H2: Matrix
  - H3: Indícios de falha do Matrix
  - H2: Relacionados

## channels/twitch.md

- Rota: /channels/twitch
- Títulos:
  - H2: Instalação
  - H2: Configuração rápida
  - H2: O que é
  - H2: Renovação do token (opcional)
  - H2: Suporte a várias contas
  - H2: Controle de acesso
  - H2: Solução de problemas
  - H2: Configuração
  - H3: Configuração da conta
  - H3: Opções do provedor
  - H2: Ações de ferramentas
  - H2: Segurança e operações
  - H2: Limites
  - H2: Conteúdo relacionado

## channels/wechat.md

- Rota: /channels/wechat
- Títulos:
  - H2: Nomenclatura
  - H2: Como funciona
  - H2: Instalação
  - H2: Login
  - H2: Controle de acesso
  - H2: Compatibilidade
  - H2: Processo auxiliar
  - H2: Solução de problemas
  - H2: Documentação relacionada

## channels/whatsapp.md

- Rota: /channels/whatsapp
- Títulos:
  - H2: Instalação
  - H2: Configuração rápida
  - H2: Padrões de implantação
  - H2: Modelo de execução
  - H2: Ligar para o solicitante atual com o MeowCaller (experimental)
  - H2: Solicitações de aprovação
  - H2: Hooks de Plugin e privacidade
  - H2: Controle de acesso e ativação
  - H2: Vinculações ACP configuradas
  - H2: Comportamento com número pessoal e conversa consigo mesmo
  - H2: Normalização de mensagens e contexto
  - H2: Entrega, divisão em partes e mídia
  - H2: Citação de respostas
  - H2: Nível de reações
  - H2: Reações de confirmação
  - H2: Reações de status do ciclo de vida
  - H2: Várias contas e credenciais
  - H2: Ferramentas, ações e gravações de configuração
  - H2: Solução de problemas
  - H2: Prompts do sistema
  - H2: Referências de configuração
  - H2: Conteúdo relacionado

## channels/yuanbao.md

- Rota: /channels/yuanbao
- Títulos:
  - H2: Início rápido
  - H3: Configuração interativa (alternativa)
  - H2: Controle de acesso
  - H3: Mensagens diretas
  - H3: Conversas em grupo
  - H2: Exemplos de configuração
  - H2: Comandos comuns
  - H2: Solução de problemas
  - H2: Configuração avançada
  - H3: Várias contas
  - H3: Limites de mensagens
  - H3: Streaming
  - H3: Contexto do histórico de conversas em grupo
  - H3: Modo de resposta
  - H3: Injeção de dicas de Markdown
  - H3: Modo de depuração
  - H3: Roteamento de vários agentes
  - H2: Referência de configuração
  - H2: Tipos de mensagem compatíveis
  - H2: Conteúdo relacionado

## channels/zalo.md

- Rota: /channels/zalo
- Títulos:
  - H2: Plugin incluído
  - H2: Configuração rápida
  - H2: O que é
  - H2: Como funciona
  - H2: Limites
  - H2: Controle de acesso
  - H3: Mensagens diretas
  - H3: Grupos
  - H2: Long polling versus webhook
  - H2: Tipos de mensagem compatíveis
  - H2: Recursos
  - H2: Destinos de entrega (CLI/cron)
  - H2: Solução de problemas
  - H2: Referência de configuração
  - H2: Conteúdo relacionado

## channels/zaloclawbot.md

- Rota: /channels/zaloclawbot
- Títulos:
  - H2: Compatibilidade
  - H2: Pré-requisitos
  - H2: Instalação com o onboard (recomendado)
  - H2: Instalação manual
  - H3: 1. Instale o Plugin
  - H3: 2. Ative o Plugin na configuração
  - H3: 3. Gere um código QR e faça login
  - H3: 4. Reinicie o Gateway
  - H2: Como funciona
  - H2: Funcionamento interno
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## channels/zalouser.md

- Rota: /channels/zalouser
- Títulos:
  - H2: Instalação
  - H2: Configuração rápida
  - H2: O que é
  - H2: Nomenclatura
  - H2: Como encontrar IDs (diretório)
  - H2: Limites
  - H2: Controle de acesso (mensagens diretas)
  - H2: Acesso a grupos (opcional)
  - H3: Restrição por menção no grupo
  - H2: Várias contas
  - H2: Variáveis de ambiente
  - H2: Digitação, reações e confirmações de entrega
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## ci.md

- Rota: /ci
- Títulos:
  - H2: Visão geral do pipeline
  - H2: Ordem de interrupção rápida
  - H2: Contexto e evidências da PR
  - H2: Escopo e roteamento
  - H2: Encaminhamento de atividades do ClawSweeper
  - H2: Execuções manuais
  - H2: Executores
  - H2: Limite de registro de executores
  - H2: Equivalentes locais
  - H2: Desempenho do OpenClaw
  - H2: Validação completa da versão
  - H2: Fragmentos de testes ao vivo e E2E
  - H2: Aceitação de pacotes
  - H3: Tarefas
  - H3: Fontes candidatas
  - H3: Perfis de conjuntos de testes
  - H3: Janelas de compatibilidade legada
  - H3: Exemplos
  - H2: Teste rápido de instalação
  - H2: E2E local com Docker
  - H3: Parâmetros ajustáveis
  - H3: Fluxo de trabalho reutilizável ao vivo/E2E
  - H3: Partes do fluxo de lançamento
  - H2: Pré-lançamento de Plugins
  - H2: Laboratório de QA
  - H2: CodeQL
  - H3: Categorias de segurança
  - H3: Fragmentos de segurança específicos da plataforma
  - H3: Categorias críticas de qualidade
  - H2: Fluxos de trabalho de manutenção
  - H3: Agente de documentação
  - H3: Agente de desempenho de testes
  - H3: PRs duplicadas após a mesclagem
  - H2: Barreiras de verificação local e roteamento de alterações
  - H2: Validação no Testbox
  - H2: Conteúdo relacionado

## clawhub/cli.md

- Rota: /clawhub/cli
- Títulos:
  - H1: CLI do ClawHub
  - H2: Descoberta e instalação
  - H3: Confiança na versão
  - H2: Publicação e manutenção
  - H2: Conteúdo relacionado

## clawhub/publishing.md

- Rota: /clawhub/publishing
- Títulos:
  - H1: Publicação no ClawHub
  - H2: Proprietários
  - H2: Skills
  - H2: Plugins
  - H2: Fluxo de lançamento
  - H2: Perguntas frequentes
  - H3: O escopo do pacote deve corresponder ao proprietário selecionado

## cli/acp.md

- Rota: /cli/acp
- Títulos:
  - H2: O que isto não é
  - H2: Matriz de compatibilidade
  - H2: Limitações conhecidas
  - H2: Uso
  - H2: Cliente ACP (depuração)
  - H2: Teste rápido do protocolo
  - H2: Como usar
  - H2: Seleção de agentes
  - H2: Uso a partir do acpx (Codex, Claude e outros clientes ACP)
  - H2: Configuração do editor Zed
  - H2: Mapeamento de sessões
  - H2: Opções
  - H3: Opções do cliente ACP
  - H2: Conteúdo relacionado

## cli/agent.md

- Rota: /cli/agent
- Títulos:
  - H1: openclaw agent
  - H2: Opções
  - H2: Exemplos
  - H2: Observações
  - H2: Status de entrega em JSON
  - H2: Conteúdo relacionado

## cli/agents.md

- Rota: /cli/agents
- Títulos:
  - H1: openclaw agents
  - H2: Exemplos
  - H2: Superfície de comandos
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents set-identity
  - H3: agents delete &lt;id&gt;
  - H2: Vinculações de roteamento
  - H3: Formato de --bind
  - H3: Comportamento do escopo de vinculação
  - H2: Arquivos de identidade
  - H2: Definição da identidade
  - H2: Conteúdo relacionado

## cli/approvals.md

- Rota: /cli/approvals
- Títulos:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Comandos comuns
  - H2: Substituição das aprovações a partir de um arquivo
  - H2: Exemplo de "Nunca solicitar" / YOLO
  - H2: Auxiliares da lista de permissões
  - H2: Opções comuns
  - H2: Observações
  - H2: Conteúdo relacionado

## cli/attach.md

- Rota: /cli/attach
- Títulos: nenhum

## cli/audit.md

- Rota: /cli/audit
- Títulos:
  - H1: openclaw audit
  - H2: Filtros
  - H2: Eventos registrados
  - H2: RPC do Gateway
  - H2: Conteúdo relacionado

## cli/backup.md

- Rota: /cli/backup
- Títulos:
  - H1: openclaw backup
  - H2: Observações
  - H2: O que é incluído no backup
  - H2: Comportamento com configuração inválida
  - H2: Tamanho e desempenho
  - H2: Conteúdo relacionado

## cli/browser.md

- Rota: /cli/browser
- Títulos:
  - H1: openclaw browser
  - H2: Flags comuns
  - H2: Início rápido (local)
  - H2: Solução rápida de problemas
  - H2: Ciclo de vida
  - H2: Se o comando estiver ausente
  - H2: Perfis
  - H2: Abas
  - H2: Snapshot / captura de tela / ações
  - H2: Estado e armazenamento
  - H2: Depuração
  - H2: Chrome existente via MCP
  - H2: Controle remoto do navegador (proxy do host do Node)
  - H2: Conteúdo relacionado

## cli/channels.md

- Rota: /cli/channels
- Títulos:
  - H1: openclaw channels
  - H2: Comandos comuns
  - H2: Status / recursos / resolução / logs
  - H2: Adição / remoção de contas
  - H2: Login e logout (interativos)
  - H2: Solução de problemas
  - H2: Sondagem de recursos
  - H2: Resolução de nomes para IDs
  - H2: Conteúdo relacionado

## cli/clawbot.md

- Rota: /cli/clawbot
- Títulos:
  - H1: openclaw clawbot
  - H2: Migração
  - H2: Conteúdo relacionado

## cli/commitments.md

- Rota: /cli/commitments
- Títulos:
  - H2: Uso
  - H2: Opções
  - H2: Exemplos
  - H2: Saída
  - H2: Conteúdo relacionado

## cli/completion.md

- Rota: /cli/completion
- Títulos:
  - H1: openclaw completion
  - H2: Uso
  - H2: Opções
  - H2: Fluxo de instalação
  - H2: Observações
  - H2: Conteúdo relacionado

## cli/config.md

- Rota: /cli/config
- Títulos:
  - H2: Opções raiz
  - H2: Exemplos
  - H3: Caminhos
  - H3: config get
  - H3: config file
  - H3: config schema
  - H3: config validate
  - H2: Valores
  - H2: Modos de config set
  - H3: Flags do construtor de provedores
  - H2: config patch
  - H2: Simulação
  - H3: Formato da saída JSON
  - H2: Aplicação das alterações
  - H2: Segurança da gravação
  - H2: Ciclo de reparo
  - H2: Conteúdo relacionado

## cli/configure.md

- Rota: /cli/configure
- Títulos:
  - H1: openclaw configure
  - H2: Opções
  - H2: Seção de modelo
  - H2: Seção Web
  - H2: Outras observações
  - H2: Conteúdo relacionado

## cli/crestodian.md

- Rota: /cli/crestodian
- Títulos:
  - H1: openclaw crestodian
  - H2: Quando é iniciado
  - H2: O que o Crestodian exibe
  - H2: Exemplos
  - H2: Operações e aprovação
  - H3: Alternância para a configuração mascarada do canal
  - H2: Inicialização da configuração
  - H2: Conversa com IA
  - H3: Modelo de confiança do ambiente de CLI
  - H2: Alternância para um agente
  - H2: Modo de recuperação de mensagens
  - H2: Conteúdo relacionado

## cli/cron.md

- Rota: /cli/cron
- Títulos:
  - H1: openclaw cron
  - H2: Criação rápida de tarefas
  - H2: Sessões
  - H2: Entrega
  - H3: Responsabilidade pela entrega
  - H3: Entrega em caso de falha
  - H2: Agendamento
  - H3: Tarefas de execução única
  - H3: Tarefas recorrentes
  - H3: Execuções manuais
  - H2: Modelos
  - H3: Precedência de modelos no Cron isolado
  - H3: Modo rápido
  - H3: Novas tentativas de troca do modelo ao vivo
  - H2: Saída da execução e recusas
  - H3: Supressão de confirmações obsoletas
  - H3: Supressão de tokens silenciosos
  - H3: Recusas estruturadas
  - H2: Retenção
  - H2: Migração de tarefas antigas
  - H2: Edições comuns
  - H2: Comandos administrativos comuns
  - H2: Conteúdo relacionado

## cli/daemon.md

- Rota: /cli/daemon
- Títulos:
  - H1: openclaw daemon
  - H2: Uso
  - H2: Subcomandos e opções
  - H2: Observações
  - H2: Conteúdo relacionado

## cli/dashboard.md

- Rota: /cli/dashboard
- Títulos:
  - H1: openclaw dashboard
  - H2: Conteúdo relacionado

## cli/devices.md

- Rota: /cli/devices
- Títulos:
  - H1: openclaw devices
  - H2: Opções comuns
  - H2: Comandos
  - H3: openclaw devices list
  - H3: openclaw devices approve [requestId] [--latest]
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices rename --device &lt;id&gt; --name &lt;label&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Observações
  - H2: Lista de verificação para recuperação de divergência de tokens
  - H2: Aprovação da primeira execução do Paperclip / openclawgateway
  - H2: Conteúdo relacionado

## cli/directory.md

- Rota: /cli/directory
- Títulos:
  - H1: openclaw directory
  - H2: Flags comuns
  - H2: Observações
  - H2: Uso dos resultados com message send
  - H2: Formatos de ID por canal
  - H2: O próprio usuário ("me")
  - H2: Pares (contatos/usuários)
  - H2: Grupos
  - H2: Conteúdo relacionado

## cli/dns.md

- Rota: /cli/dns
- Títulos:
  - H1: openclaw dns
  - H2: dns setup
  - H2: Conteúdo relacionado

## cli/docs.md

- Rota: /cli/docs
- Títulos:
  - H1: openclaw docs
  - H2: Uso
  - H2: Exemplos
  - H2: Como funciona
  - H2: Saída
  - H2: Códigos de saída
  - H2: Conteúdo relacionado

## cli/doctor.md

- Rota: /cli/doctor
- Títulos:
  - H1: openclaw doctor
  - H2: Posturas
  - H2: Exemplos
  - H2: Opções
  - H2: Modo de lint
  - H2: Verificações estruturadas de integridade
  - H2: Seleção de verificações
  - H2: Modo pós-atualização
  - H2: Compaction do SQLite de estado compartilhado
  - H2: Migração de sessões para SQLite
  - H3: Rebaixamento de versão após a migração de sessões para SQLite
  - H2: Observações
  - H2: macOS: substituições de variáveis de ambiente do launchctl
  - H2: Conteúdo relacionado

## cli/fleet.md

- Rota: /cli/fleet
- Títulos:
  - H1: openclaw fleet
  - H2: Início rápido
  - H2: IDs de locatários
  - H2: fleet create
  - H3: Opções de criação
  - H3: Fixação por digest
  - H3: Limites de disco
  - H3: Política de saída
  - H2: fleet list
  - H2: fleet status
  - H2: fleet logs
  - H2: fleet start, fleet stop e fleet restart
  - H2: fleet upgrade
  - H2: fleet backup e fleet restore
  - H2: fleet doctor
  - H2: fleet rm
  - H2: Layout de armazenamento e contêineres
  - H2: Perfil de segurança
  - H2: Tratamento de tokens
  - H2: Conteúdo relacionado

## cli/flows.md

- Rota: /cli/flows
- Títulos:
  - H1: openclaw tasks flow
  - H2: Subcomandos
  - H3: Valores do filtro de status
  - H2: Exemplos
  - H2: Conteúdo relacionado

## cli/gateway.md

- Rota: /cli/gateway
- Títulos:
  - H2: Executar o Gateway
  - H3: Opções
  - H2: Reiniciar o Gateway
  - H3: Análise de desempenho do Gateway
  - H2: Consultar um Gateway em execução
  - H3: integridade do gateway
  - H3: custo de uso do gateway
  - H3: estabilidade do gateway
  - H3: exportação de diagnósticos do gateway
  - H3: status do gateway
  - H3: sondagem do gateway
  - H4: Remoto por SSH (paridade com o aplicativo para Mac)
  - H3: chamada do gateway &lt;método&gt;
  - H2: Gerenciar o serviço do Gateway
  - H3: Instalar com um wrapper
  - H2: Descobrir gateways (Bonjour)
  - H3: descoberta de gateways
  - H2: Relacionado

## cli/health.md

- Rota: /cli/health
- Títulos:
  - H1: integridade do openclaw
  - H2: Opções
  - H2: Comportamento
  - H2: Relacionado

## cli/hooks.md

- Rota: /cli/hooks
- Títulos:
  - H1: hooks do openclaw
  - H2: Listar hooks
  - H2: Obter informações do hook
  - H2: Verificar qualificação
  - H2: Habilitar um hook
  - H2: Desabilitar um hook
  - H2: Instalar e atualizar pacotes de hooks
  - H2: Hooks incluídos
  - H3: arquivo de log do command-logger
  - H2: Observações
  - H2: Relacionado

## cli/index.md

- Rota: /cli
- Títulos:
  - H2: Páginas de comandos
  - H2: Opções globais
  - H2: Modos de saída
  - H2: Paleta de cores
  - H2: Árvore de comandos
  - H2: Comandos de barra do chat
  - H2: Acompanhamento de uso
  - H2: Relacionado

## cli/infer.md

- Rota: /cli/infer
- Títulos:
  - H2: Transformar infer em uma Skill
  - H2: Árvore de comandos
  - H2: Tarefas comuns
  - H2: Comportamento
  - H2: Modelo
  - H2: Imagem
  - H2: Áudio
  - H2: TTS
  - H2: Vídeo
  - H2: Web
  - H2: Incorporação
  - H2: Saída JSON
  - H2: Armadilhas comuns
  - H2: Relacionado

## cli/logs.md

- Rota: /cli/logs
- Títulos:
  - H1: logs do openclaw
  - H2: Opções
  - H2: Opções compartilhadas de RPC do Gateway
  - H2: Exemplos
  - H2: Comportamento de fallback e recuperação
  - H2: Relacionado

## cli/mcp.md

- Rota: /cli/mcp
- Títulos:
  - H2: Escolher o caminho MCP correto
  - H2: OpenClaw como servidor MCP
  - H3: Quando usar serve
  - H3: Como funciona
  - H3: Escolher um modo de cliente
  - H3: O que serve expõe
  - H3: Uso
  - H3: Ferramentas de ponte
  - H3: Modelo de eventos
  - H3: Notificações do canal Claude
  - H3: Configuração do cliente MCP
  - H3: Opções
  - H3: Limite de segurança e confiança
  - H3: Testes
  - H3: Solução de problemas
  - H2: OpenClaw como registro de clientes MCP
  - H3: Definições salvas de servidores MCP
  - H3: Receitas comuns de servidores
  - H3: Formatos de saída JSON
  - H3: Transporte Stdio
  - H3: Transporte SSE / HTTP
  - H3: Fluxo de trabalho OAuth
  - H3: Transporte HTTP com streaming
  - H2: Interface de controle
  - H2: Aplicativos MCP
  - H2: Limites atuais
  - H2: Relacionado

## cli/memory.md

- Rota: /cli/memory
- Títulos:
  - H1: memória do openclaw
  - H2: status da memória
  - H2: índice da memória
  - H2: pesquisa na memória
  - H2: promoção da memória
  - H2: explicação da promoção da memória
  - H2: harness REM da memória
  - H2: preenchimento retroativo REM da memória
  - H2: Dreaming
  - H2: dependência SecretRef do gateway
  - H2: Relacionado

## cli/message.md

- Rota: /cli/message
- Títulos:
  - H1: mensagem do openclaw
  - H2: Seleção de canal
  - H2: Formatos de destino (-t, --target)
  - H2: Opções comuns
  - H2: Resolução de SecretRef
  - H2: Ações
  - H3: Núcleo
  - H3: Enviar
  - H3: Enquete
  - H3: Tópicos
  - H3: Emojis
  - H3: Figurinhas
  - H3: Funções, canais, voz e eventos (Discord)
  - H3: Moderação (Discord)
  - H3: Transmissão
  - H2: Relacionado

## cli/migrate.md

- Rota: /cli/migrate
- Títulos:
  - H1: migração do openclaw
  - H2: Comandos
  - H2: Modelo de segurança
  - H2: Provedor Claude
  - H3: O que o Claude importa
  - H3: Estado de arquivamento e revisão manual
  - H2: Provedor Codex
  - H3: O que o Codex importa
  - H3: Estado do Codex para revisão manual
  - H2: Provedor Hermes
  - H3: O que o Hermes importa
  - H3: Chaves .env compatíveis
  - H3: Estado somente para arquivamento
  - H3: Após a aplicação
  - H2: Contrato do Plugin
  - H2: Integração de configuração inicial
  - H2: Relacionado

## cli/models.md

- Rota: /cli/models
- Títulos:
  - H1: modelos do openclaw
  - H2: Comandos comuns
  - H3: Status
  - H3: Lista
  - H3: Definir modelo padrão / de imagem
  - H3: Verificação
  - H2: Aliases
  - H2: Fallbacks
  - H2: Perfis de autenticação
  - H2: Relacionado

## cli/node.md

- Rota: /cli/node
- Títulos:
  - H1: node do openclaw
  - H2: Por que usar um host Node?
  - H2: Proxy do navegador (sem configuração)
  - H2: Executar (primeiro plano)
  - H2: Autenticação do Gateway para o host Node
  - H2: Serviço (segundo plano)
  - H2: Pareamento
  - H3: Estado de identidade e pareamento
  - H2: Aprovações de execução
  - H2: Relacionado

## cli/nodes.md

- Rota: /cli/nodes
- Títulos:
  - H1: nodes do openclaw
  - H2: Status
  - H2: Pareamento
  - H2: Invocar
  - H2: Notificação, push, localização e tela
  - H2: Relacionado

## cli/onboard.md

- Rota: /cli/onboard
- Títulos:
  - H1: configuração inicial do openclaw
  - H2: Exemplos
  - H2: Fluxo guiado
  - H2: Redefinição
  - H2: Localidade
  - H2: Configuração não interativa
  - H3: Autenticação do Gateway (não interativa)
  - H3: Integridade do gateway local
  - H3: Modo de referência interativo
  - H3: Opções de endpoint da Z.AI
  - H2: Opções não interativas adicionais
  - H2: Pré-filtragem de provedores
  - H2: Acompanhamentos de pesquisa na web
  - H2: Outros comportamentos
  - H2: Comandos comuns de acompanhamento

## cli/pairing.md

- Rota: /cli/pairing
- Títulos:
  - H1: pareamento do openclaw
  - H2: Comandos
  - H2: lista de pareamento
  - H2: aprovação de pareamento
  - H3: Inicialização do proprietário
  - H2: Relacionado

## cli/path.md

- Rota: /cli/path
- Títulos:
  - H1: caminho do openclaw
  - H2: Por que usá-lo
  - H2: Como ele é usado
  - H2: Como funciona
  - H2: Subcomandos
  - H2: Opções globais
  - H2: Sintaxe oc://
  - H2: Endereçamento por tipo de arquivo
  - H2: Contrato de mutação
  - H2: Exemplos
  - H2: Receitas por tipo de arquivo
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Referência de subcomandos
  - H3: resolver &lt;caminho-oc&gt;
  - H3: localizar &lt;padrão&gt;
  - H3: definir &lt;caminho-oc&gt; &lt;valor&gt;
  - H3: validar &lt;caminho-oc&gt;
  - H3: emitir &lt;arquivo&gt;
  - H2: Códigos de saída
  - H2: Modo de saída
  - H2: Observações
  - H2: Relacionado

## cli/plugins.md

- Rota: /cli/plugins
- Títulos:
  - H2: Comandos
  - H2: Criar
  - H3: Estrutura inicial do provedor
  - H2: Instalar
  - H3: Forma abreviada do marketplace
  - H2: Lista
  - H3: Índice de Plugins
  - H2: Desinstalar
  - H2: Atualizar
  - H2: Inspecionar
  - H2: Diagnóstico
  - H2: Registro
  - H2: Marketplace
  - H2: Relacionado

## cli/policy.md

- Rota: /cli/policy
- Títulos:
  - H1: política do openclaw
  - H2: Início rápido
  - H3: Referência de regras de política
  - H4: Sobreposições com escopo
  - H4: Canais
  - H4: Servidores MCP
  - H4: Provedores de modelos
  - H4: Rede
  - H4: Entrada e acesso a canais
  - H4: Gateway
  - H4: Espaço de trabalho do agente
  - H4: Postura do sandbox
  - H4: Tratamento de dados
  - H4: Segredos
  - H4: Aprovações de execução
  - H4: Perfis de autenticação
  - H4: Metadados de ferramentas
  - H4: Postura das ferramentas
  - H2: Executar verificações
  - H2: Configurar política
  - H2: Aceitar estado da política
  - H2: Constatações
  - H2: Reparar
  - H2: Códigos de saída
  - H2: Relacionado

## cli/promos.md

- Rota: /cli/promos
- Títulos:
  - H1: promoções do openclaw
  - H2: Comandos
  - H2: lista de promoções do openclaw
  - H2: resgatar promoção do openclaw &lt;slug&gt;
  - H2: Descoberta passiva na lista de modelos

## cli/proxy.md

- Rota: /cli/proxy
- Títulos:
  - H1: proxy do openclaw
  - H2: Validar
  - H3: Opções
  - H2: Depurar proxy
  - H2: Relacionado

## cli/qr.md

- Rota: /cli/qr
- Títulos:
  - H1: qr do openclaw
  - H2: Opções
  - H2: Conteúdo do código de configuração
  - H2: Resolução da URL do Gateway
  - H2: Resolução de autenticação (sem --remote)
  - H2: Resolução de autenticação (--remote)
  - H2: Relacionado

## cli/reset.md

- Rota: /cli/reset
- Títulos:
  - H1: redefinição do openclaw
  - H2: Opções
  - H2: Escopos
  - H2: Observações
  - H2: Relacionado

## cli/sandbox.md

- Rota: /cli/sandbox
- Títulos:
  - H2: Comandos
  - H3: lista de sandboxes do openclaw
  - H3: recriação do sandbox do openclaw
  - H3: explicação do sandbox do openclaw
  - H2: Por que a recriação é necessária
  - H2: Gatilhos comuns
  - H2: Migração do registro
  - H2: Configuração
  - H2: Relacionado

## cli/secrets.md

- Rota: /cli/secrets
- Títulos:
  - H1: segredos do openclaw
  - H2: Recarregar snapshot do ambiente de execução
  - H2: Auditoria
  - H2: Configurar (assistente interativo)
  - H3: Segurança do provedor de execução
  - H2: Aplicar um plano salvo
  - H3: Por que não há backups para reversão
  - H2: Exemplo
  - H2: Relacionado

## cli/security.md

- Rota: /cli/security
- Títulos:
  - H1: segurança do openclaw
  - H2: Modos de auditoria
  - H2: O que é verificado
  - H2: Comportamento de SecretRef
  - H2: Supressões
  - H2: Saída JSON
  - H2: O que --fix altera
  - H2: Relacionado

## cli/sessions.md

- Rota: /cli/sessions
- Títulos:
  - H1: sessões do openclaw
  - H2: Acompanhar o progresso da trajetória
  - H2: Exportar um pacote de trajetória
  - H2: Manutenção de limpeza
  - H2: Compactar uma sessão
  - H3: RPC sessions.compact
  - H2: Relacionado

## cli/setup.md

- Rota: /cli/setup
- Títulos:
  - H1: configuração do openclaw
  - H2: Opções
  - H3: Modo de linha de base
  - H2: Exemplos
  - H2: Observações
  - H2: Relacionado

## cli/skills.md

- Rota: /cli/skills
- Títulos:
  - H1: Skills do openclaw
  - H2: Comandos
  - H2: Oficina de Skills
  - H2: Relacionado

## cli/status.md

- Rota: /cli/status
- Títulos:
  - H2: Resolução de sessão e modelo
  - H2: Uso e cota
  - H2: Visão geral e status da atualização
  - H2: Segredos
  - H2: Memória
  - H2: Relacionado

## cli/system.md

- Rota: /cli/system
- Títulos:
  - H1: sistema do openclaw
  - H2: Comandos comuns
  - H2: evento do sistema
  - H2: último|habilitar|desabilitar heartbeat do sistema
  - H2: presença do sistema
  - H2: Observações
  - H2: Relacionado

## cli/tasks.md

- Rota: /cli/tasks
- Títulos:
  - H2: Uso
  - H2: Opções raiz
  - H2: Subcomandos
  - H3: listar
  - H3: mostrar
  - H3: notificar
  - H3: cancelar
  - H3: auditar
  - H3: manutenção
  - H3: fluxo
  - H2: Relacionado

## cli/transcripts.md

- Rota: /cli/transcripts
- Títulos:
  - H1: transcrições do openclaw
  - H2: Comandos
  - H2: Saída
  - H2: Muitas sessões por dia
  - H2: Resumos ausentes
  - H2: Configuração

## cli/tui.md

- Rota: /cli/tui
- Títulos:
  - H1: tui do openclaw
  - H2: Opções
  - H2: Observações
  - H2: Exemplos
  - H2: Ciclo de reparo da configuração
  - H2: Relacionado

## cli/uninstall.md

- Rota: /cli/uninstall
- Títulos:
  - H1: desinstalação do openclaw
  - H2: Opções
  - H2: Exemplos
  - H2: Observações
  - H2: Relacionado

## cli/update.md

- Rota: /cli/update
- Títulos:
  - H1: atualização do openclaw
  - H2: Uso
  - H2: Opções
  - H2: status da atualização
  - H2: reparo da atualização
  - H2: assistente de atualização
  - H2: O que ele faz
  - H3: Transferência da reinicialização
  - H3: Formato da resposta do plano de controle
  - H2: Fluxo de checkout do Git
  - H3: Seleção de canal
  - H3: Etapas da atualização
  - H3: Detalhes da sincronização de Plugins
  - H2: Relacionado

## cli/voicecall.md

- Rota: /cli/voicecall
- Títulos:
  - H1: chamada de voz do openclaw
  - H2: Subcomandos
  - H2: Configuração e teste rápido
  - H3: configuração
  - H3: teste rápido
  - H2: Ciclo de vida da chamada
  - H3: chamada
  - H3: iniciar
  - H3: continuar
  - H3: falar
  - H3: dtmf
  - H3: encerrar
  - H3: status
  - H2: Logs e métricas
  - H3: acompanhar
  - H3: latência
  - H2: Exposição de webhooks
  - H3: expor
  - H2: Relacionado

## cli/webhooks.md

- Rota: /cli/webhooks
- Títulos:
  - H1: webhooks do openclaw
  - H2: Subcomandos
  - H2: configuração dos webhooks do gmail
  - H3: Obrigatório
  - H3: Opções de Pub/Sub
  - H3: Opções de entrega do OpenClaw
  - H3: Opções do gog watch serve
  - H3: Exposição pelo Tailscale
  - H3: Saída
  - H2: execução dos webhooks do gmail
  - H2: Relacionado

## cli/wiki.md

- Rota: /cli/wiki
- Títulos:
  - H1: wiki do openclaw
  - H2: Comandos comuns
  - H2: Seleção de agente
  - H2: Comandos
  - H3: status da wiki
  - H3: diagnóstico da wiki
  - H3: inicialização da wiki
  - H3: ingestão da wiki &lt;caminho&gt;
  - H3: importação okf da wiki &lt;caminho&gt;
  - H3: compilação da wiki
  - H3: lint da wiki
  - H3: pesquisa na wiki &lt;consulta&gt;
  - H3: obtenção na wiki &lt;busca&gt;
  - H3: aplicação da wiki
  - H3: importação da ponte da wiki
  - H3: importação local insegura da wiki
  - H3: importação do chatgpt na wiki
  - H3: reversão do chatgpt na wiki &lt;id-da-execução&gt;
  - H3: wiki obsidian ...
  - H2: Orientações práticas de uso
  - H2: Integrações de configuração
  - H2: Relacionado

## cli/workboard.md

- Rota: /cli/workboard
- Títulos:
  - H2: Uso
  - H2: listar
  - H2: criar
  - H2: mostrar
  - H2: despachar
  - H2: Paridade com o comando de barra
  - H2: Permissões
  - H2: Solução de problemas
  - H3: Nenhum cartão aparece
  - H3: O despacho informa somente dados
  - H3: O despacho não inicia nada
  - H2: Relacionado

## concepts/active-memory.md

- Rota: /concepts/active-memory
- Títulos:
  - H2: Início rápido
  - H2: Como funciona
  - H2: Quando é executado
  - H3: Tipos de sessão
  - H2: Alternância por sessão
  - H2: Como visualizar
  - H2: Modos de consulta
  - H2: Estilos de prompt
  - H2: Política de fallback de modelo
  - H3: Recomendações de velocidade
  - H4: Configuração do Cerebras
  - H2: Ferramentas de memória
  - H3: memory-core integrado
  - H3: Memória do LanceDB
  - H3: Lossless Claw
  - H2: Mecanismos avançados de escape
  - H2: Persistência da transcrição
  - H2: Configuração
  - H2: Configuração recomendada
  - H3: Período de tolerância na inicialização a frio
  - H2: Depuração
  - H2: Problemas comuns
  - H2: Páginas relacionadas

## concepts/agent-loop.md

- Rota: /concepts/agent-loop
- Títulos:
  - H2: Pontos de entrada
  - H2: Sequência de execução
  - H2: Enfileiramento e simultaneidade
  - H2: Preparação da sessão e do espaço de trabalho
  - H2: Montagem do prompt
  - H2: Hooks
  - H3: Hooks internos (hooks do Gateway)
  - H3: Hooks de Plugin
  - H2: Streaming
  - H2: Execução de ferramentas
  - H2: Formatação da resposta
  - H2: Compaction e novas tentativas
  - H2: Fluxos de eventos
  - H2: Processamento do canal de chat
  - H2: Tempos limite
  - H3: Diagnóstico de sessões travadas
  - H2: Onde a execução pode terminar antecipadamente
  - H2: Conteúdo relacionado

## concepts/agent-runtimes.md

- Rota: /concepts/agent-runtimes
- Títulos:
  - H2: Superfícies do Codex
  - H2: Responsabilidade pelo runtime
  - H2: Seleção de runtime
  - H2: Runtime do agente GitHub Copilot
  - H2: Contrato de compatibilidade
  - H2: Rótulos de status
  - H2: Conteúdo relacionado

## concepts/agent-workspace.md

- Rota: /concepts/agent-workspace
- Títulos:
  - H2: Local padrão
  - H2: Pastas adicionais do espaço de trabalho
  - H2: Mapa de arquivos do espaço de trabalho
  - H2: O que NÃO está no espaço de trabalho
  - H2: Backup com Git (recomendado, privado)
  - H2: Não faça commit de segredos
  - H2: Como mover o espaço de trabalho para uma nova máquina
  - H2: Observações avançadas
  - H2: Conteúdo relacionado

## concepts/agent.md

- Rota: /concepts/agent
- Títulos:
  - H2: Espaço de trabalho (obrigatório)
  - H2: Arquivos de inicialização (injetados)
  - H2: Ferramentas integradas
  - H2: Skills
  - H2: Limites do runtime
  - H2: Sessões
  - H2: Direcionamento durante o streaming
  - H2: Referências de modelo
  - H2: Configuração (mínima)
  - H2: Conteúdo relacionado

## concepts/architecture.md

- Rota: /concepts/architecture
- Títulos:
  - H2: Visão geral
  - H2: Componentes e fluxos
  - H3: Gateway (daemon)
  - H3: Clientes (aplicativo para Mac/CLI/administração web)
  - H3: Nodes (macOS/iOS/Android/sem interface gráfica)
  - H3: WebChat
  - H2: Ciclo de vida da conexão (cliente único)
  - H2: Protocolo de comunicação (resumo)
  - H2: Pareamento e confiança local
  - H2: Tipagem do protocolo e geração de código
  - H2: Acesso remoto
  - H2: Visão geral das operações
  - H2: Invariantes
  - H2: Conteúdo relacionado

## concepts/channel-docking.md

- Rota: /concepts/channel-docking
- Títulos:
  - H2: Exemplo
  - H2: Por que usar
  - H2: Configuração obrigatória
  - H2: Comandos
  - H2: O que muda
  - H2: O que não muda
  - H2: Solução de problemas

## concepts/commitments.md

- Rota: /concepts/commitments
- Títulos:
  - H2: Ativar compromissos
  - H2: Como funciona
  - H2: Escopo
  - H2: Compromissos versus lembretes
  - H2: Gerenciar compromissos
  - H2: Privacidade e custo
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## concepts/compaction.md

- Rota: /concepts/compaction
- Títulos:
  - H2: Como funciona
  - H2: Compaction automática
  - H2: Compaction manual
  - H2: Configuração
  - H3: Como usar outro modelo
  - H3: Preservação de identificadores
  - H3: Proteção por bytes da transcrição ativa
  - H3: Transcrições sucessoras
  - H3: Avisos de Compaction
  - H3: Liberação da memória
  - H2: Provedores conectáveis de Compaction
  - H2: Compaction versus poda
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## concepts/context-engine.md

- Rota: /concepts/context-engine
- Títulos:
  - H2: Início rápido
  - H2: Como funciona
  - H3: Ciclo de vida do subagente (opcional)
  - H3: Adição ao prompt do sistema
  - H2: O mecanismo legado
  - H2: Mecanismos de Plugin
  - H3: A interface ContextEngine
  - H3: Configurações do runtime
  - H3: Requisitos do host
  - H3: Isolamento de falhas
  - H3: ownsCompaction
  - H2: Referência de configuração
  - H2: Relação com Compaction e memória
  - H2: Dicas
  - H2: Conteúdo relacionado

## concepts/context.md

- Rota: /concepts/context
- Títulos:
  - H2: Início rápido (inspecionar o contexto)
  - H2: Exemplo de saída
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: O que conta para a janela de contexto
  - H2: Como o OpenClaw cria o prompt do sistema
  - H2: Arquivos injetados do espaço de trabalho (contexto do projeto)
  - H2: Skills: injetadas versus carregadas sob demanda
  - H2: Ferramentas: há dois custos
  - H2: Comandos, diretivas e "atalhos em linha"
  - H2: Sessões, Compaction e poda (o que persiste)
  - H2: O que /context realmente informa
  - H2: Conteúdo relacionado

## concepts/delegate-architecture.md

- Rota: /concepts/delegate-architecture
- Títulos:
  - H2: O que é um delegado
  - H2: Por que usar delegados
  - H2: Níveis de capacidade
  - H3: Nível 1: somente leitura + rascunho
  - H3: Nível 2: enviar em nome de alguém
  - H3: Nível 3: proativo
  - H2: Pré-requisitos: isolamento e proteção
  - H3: Bloqueios rígidos (inegociáveis)
  - H3: Restrições de ferramentas
  - H3: Isolamento da sandbox
  - H3: Trilha de auditoria
  - H2: Como configurar um delegado
  - H3: 1. Crie o agente delegado
  - H3: 2. Configure a delegação do provedor de identidade
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Vincule o delegado aos canais
  - H3: 4. Adicione credenciais ao agente delegado
  - H2: Exemplo: assistente organizacional
  - H2: Padrão de escalabilidade
  - H2: Conteúdo relacionado

## concepts/dreaming.md

- Rota: /concepts/dreaming
- Títulos:
  - H2: O que Dreaming grava
  - H2: Modelo de fases
  - H2: Ingestão da transcrição da sessão
  - H2: Diário de sonhos
  - H2: Sinais de ranqueamento profundo
  - H3: Cobertura do relatório de avaliação paralela de QA
  - H2: Agendamento
  - H2: Início rápido
  - H2: Comando com barra
  - H2: Fluxo de trabalho da CLI
  - H2: Principais padrões
  - H2: Interface de sonhos
  - H2: Conteúdo relacionado

## concepts/experimental-features.md

- Rota: /concepts/experimental-features
- Títulos:
  - H2: Flags documentadas atualmente
  - H2: Modo enxuto para modelos locais
  - H3: Por que usar essas ferramentas
  - H3: Quando ativá-lo
  - H3: Quando deixá-lo desativado
  - H3: Ativar
  - H2: Experimental não significa oculto
  - H2: Conteúdo relacionado

## concepts/features.md

- Rota: /concepts/features
- Títulos:
  - H2: Destaques
  - H2: Lista completa
  - H2: Conteúdo relacionado

## concepts/managed-worktrees.md

- Rota: /concepts/managed-worktrees
- Títulos:
  - H2: Layout e nomes
  - H2: Provisionar arquivos ignorados
  - H2: Executar a configuração do repositório
  - H2: Árvores de trabalho da sessão
  - H2: Snapshots, limpeza e restauração
  - H2: CLI
  - H2: Métodos do Gateway
  - H2: Espaços de trabalho do quadro de trabalho

## concepts/mantis-slack-desktop-runbook.md

- Rota: /concepts/mantis-slack-desktop-runbook
- Títulos:
  - H2: Modelo de armazenamento
  - H2: Disparo pelo GitHub
  - H2: CLI local
  - H2: Modos de hidratação
  - H2: Interpretação dos tempos
  - H2: Lista de verificação de evidências
  - H2: Tratamento de falhas
  - H2: Conteúdo relacionado

## concepts/mantis.md

- Rota: /concepts/mantis
- Títulos:
  - H2: Responsabilidade
  - H2: Comandos da CLI
  - H3: discord-smoke
  - H3: run
  - H3: desktop-browser-smoke
  - H3: slack-desktop-smoke
  - H3: telegram-desktop-builder
  - H2: Manifesto de evidências
  - H2: Automação do GitHub
  - H2: Máquinas e segredos
  - H2: Resultados da execução
  - H2: Como adicionar um cenário
  - H2: Questões em aberto

## concepts/markdown-formatting.md

- Rota: /concepts/markdown-formatting
- Títulos:
  - H2: Pipeline
  - H2: Exemplo de IR
  - H2: Tratamento de tabelas
  - H2: Regras de divisão em partes
  - H2: Política de links
  - H2: Spoilers
  - H2: Como adicionar ou atualizar um formatador de canal
  - H2: Armadilhas comuns
  - H2: Conteúdo relacionado

## concepts/memory-builtin.md

- Rota: /concepts/memory-builtin
- Títulos:
  - H2: O que oferece
  - H2: Primeiros passos
  - H2: Provedores de embeddings compatíveis
  - H2: Como funciona a indexação
  - H2: Quando usar
  - H2: Solução de problemas
  - H2: Configuração
  - H2: Conteúdo relacionado

## concepts/memory-honcho.md

- Rota: /concepts/memory-honcho
- Títulos:
  - H2: O que oferece
  - H2: Ferramentas disponíveis
  - H2: Primeiros passos
  - H2: Configuração
  - H2: Como migrar a memória existente
  - H2: Como funciona
  - H2: Honcho versus memória integrada
  - H2: Comandos da CLI
  - H2: Leitura adicional
  - H2: Conteúdo relacionado

## concepts/memory-qmd.md

- Rota: /concepts/memory-qmd
- Títulos:
  - H2: O que adiciona em relação à opção integrada
  - H2: Primeiros passos
  - H3: Pré-requisitos
  - H3: Ativar
  - H2: Como o processo auxiliar funciona
  - H2: Desempenho e compatibilidade da pesquisa
  - H2: Substituições de modelo
  - H2: Indexação de caminhos adicionais
  - H2: Indexação de transcrições de sessão
  - H2: Escopo da pesquisa
  - H2: Citações
  - H2: Quando usar
  - H2: Solução de problemas
  - H2: Configuração
  - H2: Conteúdo relacionado

## concepts/memory-search.md

- Rota: /concepts/memory-search
- Títulos:
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H2: Como a pesquisa funciona
  - H2: Como melhorar a qualidade da pesquisa
  - H3: Decaimento temporal
  - H3: MMR (diversidade)
  - H3: Ativar ambos
  - H2: Memória multimodal
  - H2: Pesquisa na memória da sessão
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## concepts/memory.md

- Rota: /concepts/memory
- Títulos:
  - H2: Como funciona
  - H2: O que vai para onde
  - H2: Memórias sensíveis a ações
  - H2: Compromissos inferidos
  - H2: Ferramentas de memória
  - H2: Pesquisa na memória
  - H2: Backends de memória
  - H2: Camada de wiki de conhecimento
  - H2: Liberação automática da memória
  - H2: Dreaming
  - H2: Preenchimento retroativo fundamentado e promoção em tempo real
  - H2: CLI
  - H2: Leitura adicional

## concepts/message-lifecycle-refactor.md

- Rota: /concepts/message-lifecycle-refactor
- Títulos:
  - H2: Por que essa refatoração ocorreu
  - H2: O que foi lançado
  - H3: Contexto de envio
  - H3: Contexto de recebimento
  - H3: Pré-visualização em tempo real
  - H3: Confirmações persistentes
  - H3: Redução do SDK público
  - H2: Onde a implementação divergiu do projeto original
  - H2: Riscos concretos de migração (ainda relevantes)
  - H2: Classificação de falhas
  - H2: Questões em aberto
  - H2: Conteúdo relacionado

## concepts/messages.md

- Rota: /concepts/messages
- Títulos:
  - H2: Desduplicação de entrada
  - H2: Supressão de eventos repetidos na entrada
  - H2: Sessões e dispositivos
  - H2: Corpos de prompts e contexto do histórico
  - H2: Metadados dos resultados de ferramentas
  - H2: Enfileiramento e acompanhamentos
  - H2: Responsabilidade pela execução do canal
  - H2: Streaming, divisão em partes e processamento em lotes
  - H2: Visibilidade do raciocínio e tokens
  - H2: Prefixos, encadeamento e respostas
  - H2: Respostas silenciosas
  - H2: Conteúdo relacionado

## concepts/model-failover.md

- Rota: /concepts/model-failover
- Títulos:
  - H2: Fluxo do runtime
  - H2: Política da origem da seleção
  - H2: Cache para ignorar falhas de autenticação
  - H2: Avisos de fallback visíveis ao usuário
  - H2: Armazenamento de autenticação (chaves + OAuth)
  - H2: IDs de perfil
  - H2: Ordem de rotação
  - H3: Afinidade da sessão (favorável ao cache)
  - H3: Assinatura do OpenAI Codex com chave de API de reserva
  - H2: Períodos de espera
  - H2: Desativações por cobrança
  - H2: Fallback de modelo
  - H3: Regras da cadeia de candidatos
  - H3: Quais erros avançam o fallback
  - H3: Comportamento de ignorar versus sondar durante o período de espera
  - H2: Substituições de sessão e troca de modelo em tempo real
  - H2: Observabilidade e resumos de falhas
  - H2: Configuração relacionada

## concepts/model-providers.md

- Rota: /concepts/model-providers
- Títulos:
  - H2: Regras rápidas
  - H2: Comportamento do provedor sob responsabilidade do Plugin
  - H2: Rotação de chaves de API
  - H2: Plugins oficiais de provedores
  - H3: OpenAI
  - H3: Anthropic
  - H3: OAuth do OpenAI ChatGPT/Codex
  - H3: Outras opções hospedadas com assinatura
  - H3: OpenCode
  - H3: Google Gemini (chave de API)
  - H3: Google Vertex e Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Outros Plugins de provedores incluídos
  - H4: Peculiaridades que vale a pena conhecer
  - H2: Provedores via models.providers (URL personalizada/base)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi Coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (internacional)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Proxies locais (LM Studio, vLLM, LiteLLM etc.)
  - H2: Exemplos de CLI
  - H2: Conteúdo relacionado

## concepts/models.md

- Rota: /concepts/models
- Títulos:
  - H2: Ordem de seleção
  - H2: Origem da seleção e rigor do fallback
  - H2: Política rápida de modelos
  - H2: Integração inicial
  - H2: "O modelo não é permitido" (e por que as respostas param)
  - H2: /model no chat
  - H2: CLI
  - H2: Registro de modelos (models.json)
  - H2: Conteúdo relacionado

## concepts/multi-agent.md

- Rota: /concepts/multi-agent
- Títulos:
  - H2: O que é um agente
  - H2: Caminhos
  - H3: Modo de agente único (padrão)
  - H2: Auxiliar de agente
  - H2: Início rápido
  - H2: Vários agentes, várias personas
  - H2: Cofres de Wiki de Memória por agente
  - H2: Pesquisa de memória QMD entre agentes
  - H2: Um número do WhatsApp, várias pessoas (separação de mensagens diretas)
  - H2: Regras de roteamento
  - H2: Várias contas / números de telefone
  - H2: Conceitos
  - H2: Exemplos de plataformas
  - H2: Padrões comuns
  - H2: Configuração de sandbox e ferramentas por agente
  - H2: Relacionados

## concepts/oauth.md

- Rota: /concepts/oauth
- Títulos:
  - H2: O coletor de tokens (por que existe)
  - H2: Armazenamento (onde os tokens ficam)
  - H2: Reutilização da CLI do Anthropic Claude
  - H2: Troca OAuth (como o login funciona)
  - H3: Token de configuração do Anthropic
  - H3: OpenAI Codex (OAuth do ChatGPT)
  - H2: Renovação + expiração
  - H2: Várias contas (perfis) + roteamento
  - H3: 1) Recomendado: agentes separados
  - H3: 2) Avançado: vários perfis em um agente
  - H2: Relacionados

## concepts/parallel-specialist-lanes.md

- Rota: /concepts/parallel-specialist-lanes
- Títulos:
  - H2: Princípios fundamentais
  - H2: Implantação recomendada
  - H3: Fase 1: contratos de faixas + trabalho pesado em segundo plano
  - H3: Fase 2: controles de prioridade e concorrência
  - H3: Fase 3: coordenador / controlador de tráfego
  - H2: Modelo mínimo de contrato de faixa
  - H2: Relacionados

## concepts/personal-agent-benchmark-pack.md

- Rota: /concepts/personal-agent-benchmark-pack
- Títulos:
  - H2: Cenários
  - H2: Modelo de privacidade
  - H2: Como estender o pacote

## concepts/presence.md

- Rota: /concepts/presence
- Títulos:
  - H2: Campos de presença (o que aparece)
  - H2: Produtores (de onde vem a presença)
  - H3: 1) Entrada do próprio Gateway
  - H3: 2) Conexão WebSocket
  - H4: Por que conexões efêmeras do plano de controle não aparecem
  - H3: 3) Sinalizadores de eventos do sistema
  - H3: 4) Conexões de Node (função: node)
  - H2: Regras de mesclagem + desduplicação (por que instanceId é importante)
  - H2: TTL e tamanho limitado
  - H2: Ressalva sobre acesso remoto/túnel (IPs de loopback)
  - H2: Consumidores
  - H3: Página Dispositivos da interface de controle
  - H3: Aba Instâncias do macOS
  - H2: Dicas de depuração
  - H2: Relacionados

## concepts/progress-drafts.md

- Rota: /concepts/progress-drafts
- Títulos:
  - H2: Início rápido
  - H2: O que os usuários veem
  - H2: Escolha um modo
  - H2: Configure os rótulos
  - H2: Controle as linhas de progresso
  - H3: Modo detalhado
  - H3: Texto de comando/execução
  - H3: Faixa de comentários
  - H3: Status narrado
  - H3: Limites de linhas
  - H3: Renderização avançada (Slack)
  - H3: Ocultar linhas de ferramentas/tarefas
  - H2: Comportamento do canal
  - H2: Finalização
  - H2: Solução de problemas
  - H2: Relacionados

## concepts/qa-e2e-automation.md

- Rota: /concepts/qa-e2e-automation
- Títulos:
  - H2: Superfície de comandos
  - H3: Execução de controle de qualidade baseada em perfil
  - H2: Fluxo do operador
  - H3: Testes rápidos de observabilidade
  - H3: Faixas de testes rápidos do Matrix
  - H3: Cenários do Discord com Mantis
  - H3: Executores do Mantis para desktop do Slack e tarefas visuais
  - H3: Verificação da integridade do pool de credenciais
  - H2: Cobertura de transportes em produção
  - H2: Referência de controle de qualidade do Discord, Slack, Telegram e WhatsApp
  - H3: Flags compartilhadas da CLI
  - H3: Controle de qualidade do Telegram
  - H3: Controle de qualidade do Discord
  - H3: Controle de qualidade do Slack
  - H4: Configuração do workspace do Slack
  - H3: Controle de qualidade do WhatsApp
  - H3: Pool de credenciais do Convex
  - H2: Dados iniciais baseados no repositório
  - H2: Faixas de simulação de provedores
  - H2: Adaptadores de transporte
  - H3: Como adicionar um canal
  - H3: Nomes dos auxiliares de cenário
  - H2: Relatórios
  - H2: Documentação relacionada

## concepts/qa-matrix.md

- Rota: /concepts/qa-matrix
- Títulos:
  - H2: Início rápido
  - H2: O que a faixa faz
  - H2: CLI
  - H3: Flags comuns
  - H3: Flags de provedores
  - H2: Perfis
  - H2: Cenários
  - H2: Variáveis de ambiente
  - H2: Artefatos de saída
  - H2: Dicas de triagem
  - H2: Contrato de transporte em produção
  - H2: Relacionados

## concepts/queue-steering.md

- Rota: /concepts/queue-steering
- Títulos:
  - H2: Limite do runtime
  - H2: Modos
  - H2: Exemplo de rajada
  - H2: Escopo
  - H2: Debounce
  - H2: Relacionados

## concepts/queue.md

- Rota: /concepts/queue
- Títulos:
  - H2: Por quê
  - H2: Como funciona
  - H2: Padrões
  - H2: Modos de fila
  - H2: Opções de fila
  - H2: Direcionamento e streaming
  - H2: Precedência
  - H2: Substituições por sessão
  - H2: Cancelamento de turnos na fila
  - H2: Escopo e garantias
  - H2: Solução de problemas
  - H2: Relacionados

## concepts/retry.md

- Rota: /concepts/retry
- Títulos:
  - H2: Objetivos
  - H2: Padrões
  - H2: Comportamento
  - H3: Provedores de modelos
  - H3: Discord
  - H3: Telegram
  - H2: Configuração
  - H2: Observações
  - H2: Relacionados

## concepts/session-pruning.md

- Rota: /concepts/session-pruning
- Títulos:
  - H2: Por que isso é importante
  - H2: Como funciona
  - H2: Limpeza de imagens legadas
  - H2: Padrões inteligentes
  - H2: Ativar ou desativar
  - H2: Poda em comparação com Compaction
  - H2: Leitura adicional
  - H2: Relacionados

## concepts/session-search.md

- Rota: /concepts/session-search
- Títulos:
  - H1: Pesquisa de sessões
  - H2: Visibilidade e saída
  - H2: Ciclo de vida do índice
  - H2: Pesquisa de sessões em comparação com pesquisa de memória

## concepts/session-tool.md

- Rota: /concepts/session-tool
- Títulos:
  - H2: Ferramentas disponíveis
  - H2: Listagem e leitura de sessões
  - H2: Envio de mensagens entre sessões
  - H2: Auxiliares de status e orquestração
  - H2: Alterações de estado da sessão
  - H2: Criação de subagentes
  - H2: Visibilidade
  - H2: Leitura adicional
  - H2: Relacionados

## concepts/session.md

- Rota: /concepts/session
- Títulos:
  - H2: Como as mensagens são roteadas
  - H2: Isolamento de mensagens diretas
  - H3: Canais vinculados ao Dock
  - H2: Ciclo de vida da sessão
  - H2: Onde o estado fica
  - H2: Manutenção de sessões
  - H2: Inspeção de sessões
  - H2: Leitura adicional
  - H2: Relacionados

## concepts/soul.md

- Rota: /concepts/soul
- Títulos:
  - H2: O que deve estar em SOUL.md
  - H2: Por que isso funciona
  - H2: O prompt do Molty
  - H2: Como é um bom resultado
  - H2: Um aviso
  - H2: Relacionados

## concepts/streaming.md

- Rota: /concepts/streaming
- Títulos:
  - H2: Streaming em blocos (mensagens de canal)
  - H3: Entrega de mídia com streaming em blocos
  - H2: Algoritmo de divisão em partes (limites inferior/superior)
  - H2: Agrupamento (mesclar blocos transmitidos)
  - H2: Ritmo semelhante ao humano entre blocos
  - H2: "Transmitir partes ou tudo"
  - H2: Modos de streaming de pré-visualização
  - H3: Mapeamento de canais
  - H3: Migração de chave legada
  - H2: Comportamento do runtime
  - H3: Telegram
  - H3: Discord
  - H3: Slack
  - H3: Mattermost
  - H3: Matrix
  - H2: Atualizações da pré-visualização do progresso das ferramentas
  - H2: Renderização de rascunhos de progresso
  - H3: Faixa de progresso de comentários
  - H2: Relacionados

## concepts/system-prompt.md

- Rota: /concepts/system-prompt
- Títulos:
  - H2: Estrutura
  - H2: Modos de prompt
  - H2: Snapshots de prompts
  - H2: Injeção de inicialização do workspace
  - H2: Tratamento de horário
  - H2: Skills
  - H2: Documentação
  - H2: Relacionados

## concepts/timezone.md

- Rota: /concepts/timezone
- Títulos:
  - H2: Três superfícies de fuso horário
  - H2: Configuração do fuso horário do usuário
  - H2: Valores de fuso horário do envelope
  - H2: Quando substituir
  - H2: Relacionados

## concepts/typebox.md

- Rota: /concepts/typebox
- Títulos:
  - H2: Modelo mental (30 segundos)
  - H2: Onde os esquemas ficam
  - H2: Pipeline atual
  - H2: Como os esquemas são usados no runtime
  - H2: Exemplos de frames
  - H2: Cliente mínimo (Node.js)
  - H2: Exemplo completo: adicionar um método de ponta a ponta
  - H2: Comportamento da geração de código Swift
  - H2: Versionamento e compatibilidade
  - H2: Padrões e convenções de esquemas
  - H2: JSON do esquema em produção
  - H2: Quando você altera esquemas
  - H2: Relacionados

## concepts/typing-indicators.md

- Rota: /concepts/typing-indicators
- Títulos:
  - H2: Padrões
  - H2: Modos
  - H2: Configuração
  - H2: Observações
  - H2: Relacionados

## concepts/usage-tracking.md

- Rota: /concepts/usage-tracking
- Títulos:
  - H2: O que é
  - H2: Onde aparece
  - H2: Histórico de custos da Anthropic e da OpenAI
  - H2: Modo padrão do rodapé de uso
  - H3: Três estados distintos da sessão
  - H3: Precedência
  - H3: Redefinição em comparação com desativação
  - H3: Comportamento da alternância
  - H3: Configuração
  - H2: Rodapé completo personalizado de /usage
  - H3: Estrutura
  - H3: Caminhos de contrato
  - H3: Verbos
  - H3: Formatos das partes
  - H3: Exemplo
  - H2: Provedores + credenciais
  - H2: Relacionados

## date-time.md

- Rota: /date-time
- Títulos:
  - H2: Envelopes de mensagens (locais por padrão)
  - H3: Exemplos
  - H2: Prompt do sistema: data e hora atuais
  - H2: Linhas de eventos do sistema (locais por padrão)
  - H3: Configurar fuso horário + formato do usuário
  - H2: Detecção do formato de hora (automática)
  - H2: Payloads de ferramentas + conectores (horário bruto do provedor + campos normalizados)
  - H2: Documentação relacionada

## debug/node-issue.md

- Rota: /debug/node-issue
- Títulos:
  - H1: Falha do Node + tsx "\\name não é uma função"
  - H2: Status
  - H2: Sintoma original
  - H2: Causa
  - H2: Verificação atual de reprodução
  - H2: Soluções alternativas (se a falha retornar)
  - H2: Referências
  - H2: Relacionados

## diagnostics/flags.md

- Rota: /diagnostics/flags
- Títulos:
  - H2: Como funciona
  - H2: Flags conhecidas
  - H2: Ativar por configuração
  - H2: Substituição por variável de ambiente (pontual)
  - H2: Flags do profiler
  - H2: Artefatos da linha do tempo
  - H2: Onde os logs ficam
  - H2: Extrair logs
  - H2: Observações
  - H2: Relacionados

## gateway/audit.md

- Rota: /gateway/audit
- Títulos:
  - H1: Histórico de auditoria
  - H2: Famílias de registros
  - H2: Eventos do ciclo de vida das mensagens
  - H3: Classificação do tipo de conversa
  - H2: Modelo de privacidade
  - H2: Limites de cobertura e comprovação
  - H2: Armazenamento, retenção e migração
  - H2: Consultas
  - H2: Relacionados

## gateway/authentication.md

- Rota: /gateway/authentication
- Títulos:
  - H2: Configuração recomendada: chave de API (qualquer provedor)
  - H2: Anthropic: reutilização da CLI do Claude
  - H2: Inserção manual de token
  - H3: Credenciais baseadas em SecretRef
  - H2: Verificação do status de autenticação do modelo
  - H2: Rotação de chave de API (Gateway)
  - H2: Remoção da autenticação do provedor enquanto o Gateway está em execução
  - H2: Controle de qual credencial é usada
  - H3: IDs da OpenAI e IDs legados de openai-codex
  - H3: Durante o login (CLI)
  - H3: Por sessão (comando de chat)
  - H3: Por agente (substituição pela CLI)
  - H2: Solução de problemas
  - H3: "Nenhuma credencial encontrada"
  - H3: Token prestes a expirar/expirado
  - H2: Relacionados

## gateway/background-process.md

- Rota: /gateway/background-process
- Títulos:
  - H2: Ferramenta exec
  - H3: Substituições por variáveis de ambiente
  - H3: Configuração (preferível às substituições por variáveis de ambiente)
  - H2: Integração de processos filhos
  - H2: Ferramenta process
  - H2: Exemplos
  - H2: Relacionados

## gateway/bonjour.md

- Rota: /gateway/bonjour
- Títulos:
  - H2: Bonjour de longa distância (DNS-SD unicast) pelo Tailscale
  - H3: Configuração do Gateway
  - H3: Configuração única do servidor DNS (host do Gateway, somente macOS)
  - H3: Configurações de DNS do Tailscale
  - H3: Segurança do listener do Gateway
  - H2: O que é anunciado
  - H2: Tipos de serviço
  - H2: Chaves TXT (dicas não sigilosas)
  - H2: Depuração no macOS
  - H2: Depuração nos logs do Gateway
  - H2: Depuração no Node iOS
  - H2: Quando ativar o Bonjour
  - H2: Quando desativar o Bonjour
  - H2: Armadilhas do Docker
  - H2: Solução de problemas do Bonjour desativado
  - H2: Modos de falha comuns
  - H2: Nomes de instância com escape (\032)
  - H2: Ativação / desativação / configuração
  - H2: Documentação relacionada

## gateway/bridge-protocol.md

- Rota: /gateway/bridge-protocol
- Títulos:
  - H2: Por que existia
  - H2: Transporte
  - H2: Handshake e pareamento
  - H2: Frames
  - H2: Eventos do ciclo de vida de execução
  - H2: Uso histórico da tailnet
  - H2: Versionamento
  - H2: Relacionados

## gateway/cli-backends.md

- Rota: /gateway/cli-backends
- Títulos:
  - H2: Início rápido
  - H2: Uso como fallback
  - H2: Configuração
  - H2: Como funciona
  - H3: Particularidades da CLI do Claude
  - H2: Sessões
  - H2: Prelúdio de fallback das sessões de claude-cli
  - H2: Imagens
  - H2: Entradas e saídas
  - H2: Padrões pertencentes ao Plugin
  - H2: Sobreposições de transformação de texto
  - H2: Propriedade da Compaction nativa
  - H2: Sobreposições de pacotes MCP
  - H2: Limite do histórico de reinicialização
  - H2: Limitações
  - H2: Solução de problemas
  - H2: Relacionados

## gateway/config-agents.md

- Rota: /gateway/config-agents
- Títulos:
  - H2: Padrões do agente
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Substituições de perfil de bootstrap por agente
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Mapa de propriedade do orçamento de contexto
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Política de execução
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Transmissão em blocos
  - H3: Indicadores de digitação
  - H3: agents.defaults.sandbox
  - H3: agents.list (substituições por agente)
  - H2: Roteamento multiagente
  - H3: Campos de correspondência de vinculação
  - H3: Perfis de acesso por agente
  - H2: Sessão
  - H2: Mensagens
  - H3: Prefixo de resposta
  - H3: Reação de confirmação
  - H3: Fila
  - H3: Debounce de entrada
  - H3: Outras chaves de mensagem
  - H3: TTS (conversão de texto em fala)
  - H2: Conversa
  - H2: Relacionados

## gateway/config-channels.md

- Rota: /gateway/config-channels
- Títulos:
  - H2: Canais
  - H3: Acesso a mensagens diretas e grupos
  - H3: Substituições de modelo por canal
  - H3: Padrões de canal e Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Várias contas (todos os canais)
  - H3: Outros canais de Plugin
  - H3: Controle por menção em conversas de grupo
  - H4: Limites do histórico de mensagens diretas
  - H4: Modo de conversa consigo mesmo
  - H3: Comandos (processamento de comandos de chat)
  - H2: Relacionados

## gateway/config-tools.md

- Rota: /gateway/config-tools
- Títulos:
  - H2: Ferramentas
  - H3: Perfis de ferramentas
  - H3: Grupos de ferramentas
  - H3: Ferramentas de MCP e Plugin na política de ferramentas do sandbox
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Provedores personalizados e URLs base
  - H3: Detalhes dos campos do provedor
  - H3: Exemplos de provedores
  - H2: Relacionados

## gateway/configuration-examples.md

- Rota: /gateway/configuration-examples
- Títulos:
  - H2: Início rápido
  - H3: Mínimo absoluto
  - H3: Configuração inicial recomendada
  - H2: Exemplo expandido (principais opções)
  - H3: Repositório irmão de Skills vinculado simbolicamente
  - H2: Padrões comuns
  - H3: Base compartilhada de Skills com uma substituição
  - H3: Configuração multiplataforma
  - H3: Aprovação automática de rede de Node confiável
  - H3: Modo seguro de mensagens diretas (caixa de entrada compartilhada/mensagens diretas multiusuário)
  - H3: Chave de API da Anthropic + fallback do MiniMax
  - H3: Bot de trabalho (acesso restrito)
  - H3: Somente modelos locais
  - H2: Dicas
  - H2: Relacionados

## gateway/configuration-reference.md

- Rota: /gateway/configuration-reference
- Títulos:
  - H2: Canais
  - H2: Padrões do agente, multiagente, sessões e mensagens
  - H2: Ferramentas e provedores personalizados
  - H2: Modelos
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Configuração do Plugin de ambiente do Codex
  - H2: Compromissos
  - H2: Navegador
  - H2: Interface do usuário
  - H2: Gateway
  - H3: Endpoints compatíveis com OpenAI
  - H3: Isolamento entre várias instâncias
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Ambientes de workers na nuvem
  - H3: Perfil do Crabbox
  - H3: Perfil estático de desenvolvimento por SSH
  - H2: Hooks
  - H3: Integração com o Gmail
  - H2: Host do Plugin Canvas
  - H2: Descoberta
  - H3: mDNS (Bonjour)
  - H3: Área ampla (DNS-SD)
  - H2: Ambiente
  - H3: env (variáveis de ambiente embutidas)
  - H3: Substituição de variáveis de ambiente
  - H2: Segredos
  - H3: SecretRef
  - H3: Superfície de credenciais compatível
  - H3: Configuração de provedores de segredos
  - H2: Armazenamento de autenticação
  - H3: auth.cooldowns
  - H2: Auditoria
  - H2: Registro de logs
  - H2: Diagnóstico
  - H2: Atualização
  - H2: ACP
  - H2: CLI
  - H2: Assistente
  - H2: Identidade
  - H2: Ponte (legada, removida)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Variáveis de modelo de mídia
  - H2: Inclusões de configuração ($include)
  - H2: Relacionados

## gateway/configuration.md

- Rota: /gateway/configuration
- Títulos:
  - H2: Configuração mínima
  - H2: Edição da configuração
  - H2: Validação estrita
  - H2: Tarefas comuns
  - H2: Recarga dinâmica da configuração
  - H3: Modos de recarga
  - H3: O que é aplicado dinamicamente e o que exige reinicialização
  - H3: Planejamento da recarga
  - H2: RPC de configuração (atualizações programáticas)
  - H2: Variáveis de ambiente
  - H2: Referência completa
  - H2: Relacionados

## gateway/diagnostics.md

- Rota: /gateway/diagnostics
- Títulos:
  - H2: Início rápido
  - H2: Comando de chat
  - H2: O que a exportação contém
  - H2: Modelo de privacidade
  - H2: Gravador de estabilidade
  - H2: Opções úteis
  - H2: Desativar diagnóstico
  - H2: Relacionados

## gateway/discovery.md

- Rota: /gateway/discovery
- Títulos:
  - H2: Termos
  - H2: Por que as conexões direta e por SSH coexistem
  - H2: Entradas de descoberta
  - H3: 1) Bonjour / DNS-SD
  - H4: Detalhes do sinalizador de serviço
  - H3: 2) Tailnet (entre redes)
  - H3: 3) Destino manual / SSH
  - H2: Seleção de transporte (política do cliente)
  - H2: Pareamento e autenticação (transporte direto)
  - H2: Responsabilidades por componente
  - H2: Relacionados

## gateway/doctor.md

- Rota: /gateway/doctor
- Títulos:
  - H2: Início rápido
  - H3: Modos sem interface e de automação
  - H2: Modo de lint somente leitura
  - H2: O que ele faz (resumo)
  - H2: Preenchimento retroativo e redefinição da interface de Dreams
  - H2: Comportamento detalhado e justificativa
  - H2: Relacionados

## gateway/external-apps.md

- Rota: /gateway/external-apps
- Títulos:
  - H2: O que está disponível atualmente
  - H2: Caminho recomendado
  - H2: Suspensão cooperativa do host
  - H2: Código do aplicativo versus código do Plugin
  - H2: Relacionados

## gateway/gateway-lock.md

- Rota: /gateway/gateway-lock
- Títulos:
  - H2: Por quê
  - H2: Duas camadas
  - H3: Bloqueio de arquivo
  - H3: Vinculação de socket
  - H2: Notas operacionais
  - H2: Relacionados

## gateway/health.md

- Rota: /gateway/health
- Títulos:
  - H2: Verificações rápidas
  - H2: Diagnóstico aprofundado
  - H2: Configuração do monitor de integridade
  - H2: Monitoramento de tempo de atividade
  - H3: Exemplos de configuração do serviço de monitoramento
  - H2: Quando algo falha
  - H2: Comando dedicado "health"
  - H2: Relacionados

## gateway/heartbeat.md

- Rota: /gateway/heartbeat
- Títulos:
  - H2: Início rápido (iniciante)
  - H2: Padrões
  - H2: Para que serve o prompt de Heartbeat
  - H2: Contrato de resposta
  - H2: Configuração
  - H3: Escopo e precedência
  - H3: Heartbeats por agente
  - H3: Exemplo de horário ativo
  - H3: Configuração 24/7
  - H3: Exemplo com várias contas
  - H3: Observações sobre os campos
  - H2: Comportamento de entrega
  - H2: Controles de visibilidade
  - H3: O que cada sinalizador faz
  - H3: Exemplos por canal e por conta
  - H3: Padrões comuns
  - H2: HEARTBEAT.md (opcional)
  - H3: Blocos tasks:
  - H3: O agente pode atualizar HEARTBEAT.md?
  - H2: Ativação manual (sob demanda)
  - H2: Entrega do raciocínio (opcional)
  - H2: Considerações sobre custos
  - H2: Estouro de contexto após o Heartbeat
  - H2: Relacionados

## gateway/index.md

- Rota: /gateway
- Títulos:
  - H2: Inicialização local em 5 minutos
  - H2: Modelo de runtime
  - H2: Endpoints compatíveis com a OpenAI
  - H3: Precedência de porta e vinculação
  - H3: Modos de recarregamento a quente
  - H2: Conjunto de comandos do operador
  - H2: Vários Gateways (no mesmo host)
  - H2: Acesso remoto
  - H2: Supervisão e ciclo de vida do serviço
  - H2: Caminho rápido para o perfil de desenvolvimento
  - H2: Referência rápida do protocolo (visão do operador)
  - H2: Verificações operacionais
  - H3: Disponibilidade
  - H3: Prontidão
  - H3: Recuperação de lacunas
  - H2: Sinais comuns de falha
  - H2: Garantias de segurança
  - H2: Relacionados

## gateway/local-model-services.md

- Rota: /gateway/local-model-services
- Títulos:
  - H2: Como funciona
  - H2: Estrutura da configuração
  - H2: Campos
  - H2: Exemplo com Inferrs
  - H2: Exemplo com ds4
  - H2: Relacionados

## gateway/local-models.md

- Rota: /gateway/local-models
- Títulos:
  - H2: Requisitos mínimos de hardware
  - H2: Escolha um backend
  - H2: LM Studio + modelo local de grande porte (Responses API)
  - H3: Configuração híbrida: primário hospedado, fallback local
  - H3: Hospedagem regional / roteamento de dados
  - H2: Outros proxies locais compatíveis com a OpenAI
  - H2: Backends menores ou mais restritos
  - H2: Solução de problemas
  - H2: Relacionados

## gateway/logging.md

- Rota: /gateway/logging
- Títulos:
  - H1: Registro de logs
  - H2: Logger baseado em arquivo
  - H3: Modo detalhado vs. níveis de log
  - H2: Captura do console
  - H2: Ocultação de dados
  - H2: Logs de WebSocket do Gateway
  - H3: Estilo dos logs de WS
  - H2: Formatação do console (logs por subsistema)
  - H2: Relacionados

## gateway/multi-tenant-hosting.md

- Rota: /gateway/multi-tenant-hosting
- Títulos:
  - H1: Hospedagem multilocatário
  - H2: Por que cada locatário precisa de uma célula
  - H2: Arquitetura
  - H2: Limite de confiança
  - H2: Escala de isolamento
  - H2: Início rápido
  - H2: Adiado para depois do MVP
  - H2: Relacionados

## gateway/multiple-gateways.md

- Rota: /gateway/multiple-gateways
- Títulos:
  - H2: Início rápido do bot de resgate
  - H3: O que --profile rescue onboard altera
  - H2: Configuração geral de múltiplos gateways
  - H2: Lista de verificação de isolamento
  - H2: Mapeamento de portas (derivado)
  - H2: Observações sobre navegador/CDP (armadilha comum)
  - H2: Exemplo manual de variáveis de ambiente
  - H2: Verificações rápidas
  - H2: Relacionados

## gateway/network-model.md

- Rota: /gateway/network-model
- Títulos:
  - H2: Relacionados

## gateway/openai-http-api.md

- Rota: /gateway/openai-http-api
- Títulos:
  - H2: Como habilitar o endpoint
  - H2: Limite de segurança (importante)
  - H2: Autenticação
  - H2: Quando usar este endpoint
  - H2: Contrato de modelo centrado no agente
  - H2: Comportamento da sessão
  - H2: Limites de requisição (configuração)
  - H2: Contrato da ferramenta de chat
  - H3: Campos de requisição compatíveis
  - H3: Variantes não compatíveis
  - H3: Formato da resposta da ferramenta sem streaming
  - H3: Formato da resposta da ferramenta com streaming
  - H3: Ciclo de acompanhamento da ferramenta
  - H2: Streaming (SSE)
  - H2: Configuração rápida do Open WebUI
  - H2: Exemplos
  - H2: Relacionados

## gateway/openresponses-http-api.md

- Rota: /gateway/openresponses-http-api
- Títulos:
  - H2: Autenticação, segurança e roteamento
  - H2: Comportamento da sessão
  - H2: Formato da requisição
  - H2: Itens (entrada)
  - H3: message
  - H3: functioncalloutput (ferramentas baseadas em turnos)
  - H3: reasoning e itemreference
  - H2: Ferramentas (ferramentas de função no lado do cliente)
  - H2: Imagens (inputimage)
  - H2: Arquivos (inputfile)
  - H2: Limites de arquivos e imagens (configuração)
  - H2: Streaming (SSE)
  - H2: Uso
  - H2: Erros
  - H2: Exemplos
  - H2: Relacionados

## gateway/openshell.md

- Rota: /gateway/openshell
- Títulos:
  - H2: Pré-requisitos
  - H2: Início rápido
  - H2: Modos de espaço de trabalho
  - H3: mirror (padrão)
  - H3: remote
  - H3: Como escolher um modo
  - H2: Referência de configuração
  - H2: Exemplos
  - H3: Configuração remota mínima
  - H3: Modo mirror com GPU
  - H3: OpenShell por agente com gateway personalizado
  - H2: Gerenciamento do ciclo de vida
  - H2: Reforço de segurança
  - H2: Limitações atuais
  - H2: Como funciona
  - H2: Relacionados

## gateway/opentelemetry.md

- Rota: /gateway/opentelemetry
- Títulos:
  - H2: Início rápido
  - H2: Sinais exportados
  - H2: Referência de configuração
  - H3: Variáveis de ambiente
  - H2: Privacidade e captura de conteúdo
  - H2: Amostragem e descarregamento
  - H2: Métricas exportadas
  - H3: Uso do modelo
  - H3: Fluxo de mensagens
  - H3: Conversação
  - H3: Filas e sessões
  - H3: Telemetria de atividade da sessão
  - H3: Ciclo de vida do ambiente de execução
  - H3: Execução de ferramentas e detecção de ciclos
  - H3: Execução
  - H3: Componentes internos de diagnóstico (memória, cargas úteis, integridade do exportador)
  - H2: Spans exportados
  - H2: Catálogo de eventos de diagnóstico
  - H2: Sem um exportador
  - H2: Desativação
  - H2: Relacionados

## gateway/operator-scopes.md

- Rota: /gateway/operator-scopes
- Títulos:
  - H2: Funções
  - H2: Níveis de escopo
  - H2: O escopo do método é apenas a primeira barreira
  - H2: Aprovações de pareamento de dispositivos
  - H2: Aprovações de pareamento de Nodes
  - H2: Autenticação por segredo compartilhado

## gateway/pairing.md

- Rota: /gateway/pairing
- Títulos:
  - H2: Como funciona a aprovação de recursos
  - H2: Fluxo de trabalho da CLI (adequado para ambientes sem interface gráfica)
  - H2: Superfície da API (protocolo do Gateway)
  - H2: Controle de comandos de Node (2026.3.31+)
  - H2: Limites de confiança de eventos de Node (2026.3.31+)
  - H2: Aprovação automática de dispositivos verificados por SSH (padrão)
  - H2: Aprovação automática (aplicativo para macOS)
  - H2: Aprovação automática de dispositivos por CIDR confiável
  - H2: Limpeza silenciosa de pareamentos substituídos
  - H2: Aprovação automática de atualização de metadados
  - H2: Auxiliares de pareamento por QR
  - H2: Localidade e cabeçalhos encaminhados
  - H2: Armazenamento (local, privado)
  - H2: Comportamento do transporte
  - H2: Relacionados

## gateway/prometheus.md

- Rota: /gateway/prometheus
- Títulos:
  - H2: Início rápido
  - H2: Métricas exportadas
  - H2: Política de rótulos
  - H2: Receitas de PromQL
  - H2: Como escolher entre a exportação do Prometheus e do OpenTelemetry
  - H2: Solução de problemas
  - H2: Relacionados

## gateway/protocol.md

- Rota: /gateway/protocol
- Títulos:
  - H2: Transporte e enquadramento
  - H2: Handshake
  - H3: Função de worker e protocolo fechado
  - H3: Recursos do cliente
  - H3: Exemplo de conexão de Node
  - H2: Funções e escopos
  - H3: Recursos/comandos/permissões (Node)
  - H2: Presença
  - H3: Evento de atividade em segundo plano do Node
  - H2: Definição de escopo de eventos de transmissão
  - H2: Famílias de métodos RPC
  - H3: Famílias comuns de eventos
  - H3: Métodos auxiliares de Node
  - H2: RPC do registro de auditoria
  - H2: RPCs do registro de tarefas
  - H2: Métodos auxiliares do operador
  - H3: Visualizações de models.list
  - H2: Aprovações de execução
  - H2: Alternativa de entrega do agente
  - H2: Versionamento
  - H3: Constantes do cliente
  - H2: Autenticação
  - H2: Identidade e pareamento de dispositivos
  - H3: Diagnósticos de migração da autenticação de dispositivos
  - H2: TLS e fixação
  - H2: Escopo
  - H2: Relacionados

## gateway/remote-gateway-readme.md

- Rota: /gateway/remote-gateway-readme
- Títulos:
  - H1: Como executar o OpenClaw.app com um Gateway remoto
  - H2: Configuração
  - H2: Como funciona
  - H2: Relacionados

## gateway/remote.md

- Rota: /gateway/remote
- Títulos:
  - H2: A ideia central
  - H2: Opções de topologia
  - H2: Fluxo de comandos (o que é executado e onde)
  - H2: Túnel SSH (CLI + ferramentas)
  - H2: Padrões remotos da CLI
  - H2: Precedência de credenciais
  - H2: Acesso remoto à interface de chat
  - H2: Modo remoto do aplicativo para macOS
  - H2: Regras de segurança (remoto/VPN)
  - H3: macOS: túnel SSH persistente via LaunchAgent
  - H4: Etapa 1: adicionar a configuração SSH
  - H4: Etapa 2: copiar a chave SSH (uma única vez)
  - H4: Etapa 3: configurar o token do Gateway
  - H4: Etapa 4: criar o LaunchAgent
  - H4: Etapa 5: carregar o LaunchAgent
  - H4: Solução de problemas
  - H2: Relacionados

## gateway/restart-recovery.md

- Rota: /gateway/restart-recovery
- Títulos:
  - H2: O que persiste após uma reinicialização
  - H2: Reinicializações normais primeiro aguardam a conclusão das tarefas
  - H2: Como trabalhos interrompidos são detectados
  - H2: Retomada automática
  - H3: Subagentes
  - H3: Tarefas em segundo plano
  - H3: Reinicializações solicitadas pelo agente
  - H2: Mecanismos de segurança e observabilidade
  - H2: O que não é retomado

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Rota: /gateway/sandbox-vs-tool-policy-vs-elevated
- Títulos:
  - H2: Depuração rápida
  - H2: Sandbox: onde as ferramentas são executadas
  - H3: Montagens vinculadas (verificação rápida de segurança)
  - H2: Política de ferramentas: quais ferramentas existem/podem ser chamadas
  - H3: Grupos de ferramentas (abreviações)
  - H2: Elevado: “executar no host” somente para execução
  - H2: Correções comuns para o “confinamento da sandbox”
  - H3: “Ferramenta X bloqueada pela política de ferramentas da sandbox”
  - H3: “Eu achava que este era o principal; por que está em uma sandbox?”
  - H2: Relacionados

## gateway/sandboxing.md

- Rota: /gateway/sandboxing
- Títulos:
  - H2: O que é executado em sandbox
  - H2: Modos, escopo e backend
  - H2: Backend do Docker
  - H3: Navegador em sandbox
  - H2: Backend SSH
  - H2: Backend do OpenShell
  - H2: Acesso ao espaço de trabalho
  - H2: Montagens vinculadas personalizadas
  - H2: Imagens e configuração
  - H2: setupCommand (configuração única do contêiner)
  - H2: Política de ferramentas e mecanismos de escape
  - H2: Substituições para múltiplos agentes
  - H2: Exemplo mínimo de ativação
  - H2: Relacionados

## gateway/secrets-plan-contract.md

- Rota: /gateway/secrets-plan-contract
- Títulos:
  - H2: Formato do arquivo de plano
  - H2: Inserções/atualizações e exclusões de provedores
  - H2: Escopo de destino compatível
  - H2: Comportamento do tipo de destino
  - H2: Regras de validação de caminhos
  - H2: Comportamento em caso de falha
  - H2: Comportamento de consentimento do provedor de execução
  - H2: Observações sobre escopo de runtime e auditoria
  - H2: Verificações do operador
  - H2: Documentos relacionados

## gateway/secrets.md

- Rota: /gateway/secrets
- Títulos:
  - H2: Modelo de runtime
  - H2: Injeção no momento da saída (sentinelas)
  - H2: Limite de acesso do agente
  - H2: Filtragem de superfícies ativas
  - H2: Diagnósticos da superfície de autenticação do Gateway
  - H2: Verificação preliminar de referências de integração
  - H2: Contrato de SecretRef
  - H2: Configuração do provedor
  - H2: Chaves de API armazenadas em arquivos
  - H2: Exemplos de integração de execução
  - H2: Variáveis de ambiente do servidor MCP
  - H2: Material de autenticação SSH da sandbox
  - H2: Superfície de credenciais compatível
  - H2: Comportamento obrigatório e precedência
  - H2: Acionadores de ativação
  - H2: Sinais de degradação e recuperação
  - H2: Resolução do caminho de comandos
  - H2: Fluxo de trabalho de auditoria e configuração
  - H2: Política de segurança unidirecional
  - H2: Observações sobre compatibilidade da autenticação legada
  - H2: Observação sobre a interface Web
  - H2: Relacionados

## gateway/security/audit-checks.md

- Rota: /gateway/security/audit-checks
- Títulos:
  - H2: Relacionados

## gateway/security/exposure-runbook.md

- Rota: /gateway/security/exposure-runbook
- Títulos:
  - H2: Escolha o padrão de exposição
  - H2: Inventário preliminar
  - H2: Verificações de referência
  - H2: Configuração mínima segura
  - H2: Exposição de mensagens diretas e grupos
  - H2: Verificações de proxy reverso
  - H2: Revisão de ferramentas e da sandbox
  - H2: Validação após a alteração
  - H2: Plano de reversão
  - H2: Lista de verificação da revisão

## gateway/security/index.md

- Rota: /gateway/security
- Títulos:
  - H2: Escopo: modelo de segurança do assistente pessoal
  - H2: Auditoria de segurança do OpenClaw
  - H3: O que a auditoria verifica (visão geral)
  - H3: Ordem de prioridade na triagem de constatações
  - H2: Configuração reforçada em 60 segundos
  - H2: Matriz de limites de confiança
  - H2: Não são vulnerabilidades por definição
  - H2: Confiança no Gateway e nos Nodes
  - H2: Modelo de ameaças
  - H2: Acesso a mensagens diretas: pareamento, lista de permissões, aberto, desativado
  - H3: Listas de permissões (duas camadas)
  - H3: Isolamento de sessões de mensagens diretas (modo multiusuário)
  - H2: Visibilidade do contexto versus autorização do acionador
  - H2: Injeção de prompt
  - H3: Conteúdo externo e encapsulamento de entradas não confiáveis
  - H3: Opções de desvio (mantenha desativadas em produção)
  - H3: Raciocínio e saída detalhada em grupos
  - H2: Autorização de comandos
  - H2: Ferramentas do plano de controle
  - H2: Execução no Node (system.run)
  - H2: Skills dinâmicas (observador/Nodes remotos)
  - H2: Plugins
  - H2: Execução em sandbox
  - H3: Mecanismo de proteção da delegação a subagentes
  - H3: Modo somente leitura
  - H2: Perfis de acesso por agente (múltiplos agentes)
  - H3: Acesso total (sem sandbox)
  - H3: Ferramentas somente leitura + espaço de trabalho somente leitura
  - H3: Sem acesso ao sistema de arquivos/shell (mensagens do provedor permitidas)
  - H2: Riscos do controle do navegador
  - H3: Política de SSRF do navegador (rigorosa por padrão)
  - H2: Exposição de rede
  - H3: Vinculação, porta, firewall
  - H3: Publicação de portas do Docker com UFW
  - H3: Descoberta por mDNS/Bonjour
  - H3: Autenticação WebSocket do Gateway
  - H3: Cabeçalhos de identidade do Tailscale Serve
  - H3: Configuração de proxy reverso
  - H3: Observações sobre HSTS e origem
  - H3: Interface de controle via HTTP
  - H3: Opções inseguras/perigosas
  - H2: Confiança na implantação e no host
  - H2: Segredos em disco
  - H3: Mapa de armazenamento de credenciais
  - H3: Permissões de arquivos
  - H3: Arquivos .env do espaço de trabalho
  - H3: Logs e transcrições
  - H2: Configuração segura (copiar/colar)
  - H3: Números separados (WhatsApp, Signal, Telegram)
  - H2: Resposta a incidentes
  - H3: Conter
  - H3: Rotacionar (presuma comprometimento se segredos vazarem)
  - H3: Auditar
  - H3: Coletar para um relatório
  - H2: Verificação de segredos
  - H2: Como relatar problemas de segurança

## gateway/security/secure-file-operations.md

- Rota: /gateway/security/secure-file-operations
- Títulos:
  - H2: Padrão: sem auxiliar em Python
  - H2: O que permanece protegido sem Python
  - H2: O que o Python acrescenta
  - H2: Orientações para Plugins e núcleo

## gateway/security/shrinkwrap.md

- Rota: /gateway/security/shrinkwrap
- Títulos:
  - H2: Por que isso é importante
  - H2: Geração e verificação
  - H2: Inspeção de um pacote publicado

## gateway/tailscale.md

- Rota: /gateway/tailscale
- Títulos:
  - H2: Modos
  - H2: Exemplos de configuração
  - H3: Somente Tailnet (Serve)
  - H3: Somente Tailnet (vincular ao IP da Tailnet)
  - H3: Internet pública (Funnel + senha compartilhada)
  - H2: Exemplos da CLI
  - H2: Autenticação
  - H3: Cabeçalhos de identidade do Tailscale (somente Serve)
  - H2: Observações
  - H3: Pré-requisitos e limites do Tailscale
  - H2: Controle do navegador (Gateway remoto + navegador local)
  - H2: Saiba mais
  - H2: Relacionados

## gateway/tools-invoke-http-api.md

- Rota: /gateway/tools-invoke-http-api
- Títulos:
  - H2: Autenticação
  - H2: Limite de segurança (importante)
  - H2: Corpo da solicitação
  - H2: Comportamento de política + roteamento
  - H2: Respostas
  - H2: Exemplo
  - H2: Relacionados

## gateway/troubleshooting.md

- Rota: /gateway/troubleshooting
- Títulos:
  - H2: Sequência de comandos
  - H2: Após uma atualização
  - H2: Instalações divergentes e proteção contra configurações mais recentes
  - H2: Incompatibilidade de protocolo após reversão
  - H2: Link simbólico de Skill ignorado por escapar do caminho
  - H2: Uso adicional do Anthropic 429 necessário para contexto longo
  - H2: Respostas upstream 403 bloqueadas
  - H2: Backend local compatível com OpenAI passa nas verificações diretas, mas as execuções do agente falham
  - H2: Sem respostas
  - H2: Conectividade da interface de controle do painel
  - H3: Mapa rápido dos códigos de detalhes da autenticação
  - H2: Serviço do Gateway não está em execução
  - H2: Gateway no macOS para silenciosamente de responder e retoma quando você interage com o painel
  - H2: Loop do supervisor launchd no macOS com LaunchAgents duplicados do Gateway/Node
  - H2: Gateway é encerrado durante uso elevado de memória
  - H2: Gateway rejeitou uma configuração inválida
  - H2: Avisos de sondagem do Gateway
  - H2: Canal conectado, mas as mensagens não fluem
  - H2: Entrega de Cron e Heartbeat
  - H2: Node pareado, mas a ferramenta falha
  - H2: Ferramenta do navegador falha
  - H2: Se você atualizou e algo parou de funcionar repentinamente
  - H2: Relacionados

## gateway/trusted-proxy-auth.md

- Rota: /gateway/trusted-proxy-auth
- Títulos:
  - H2: Quando usar
  - H2: Quando NÃO usar
  - H2: Como funciona
  - H2: Configuração
  - H3: Referência de configuração
  - H2: Comportamento de pareamento da interface de controle
  - H2: Cabeçalho de escopos do operador
  - H2: Encerramento de TLS e HSTS
  - H3: Orientações para implantação
  - H2: Exemplos de configuração de proxy
  - H2: Configuração mista de tokens
  - H2: Lista de verificação de segurança
  - H2: Auditoria de segurança
  - H2: Solução de problemas
  - H2: Migração da autenticação por token
  - H2: Relacionados

## help/debugging.md

- Rota: /help/debugging
- Títulos:
  - H2: Substituições de depuração do runtime
  - H2: Saída de rastreamento da sessão
  - H2: Rastreamento do ciclo de vida do Plugin
  - H2: Inicialização da CLI e criação de perfil de comandos
  - H2: Modo de observação do Gateway
  - H2: Perfil de desenvolvimento + Gateway de desenvolvimento (--dev)
  - H2: Registro do fluxo bruto
  - H2: Observações de segurança
  - H2: Depuração no VSCode
  - H3: Configuração
  - H3: Observações
  - H2: Relacionados

## help/environment.md

- Rota: /help/environment
- Títulos:
  - H2: Precedência (da maior para a menor)
  - H2: Credenciais do provedor e .env do espaço de trabalho
  - H2: Bloco de ambiente da configuração
  - H2: Importação do ambiente do shell
  - H2: Snapshots do shell de execução
  - H2: Variáveis de ambiente injetadas pelo runtime
  - H2: Variáveis de ambiente da interface
  - H2: Substituição de variáveis de ambiente na configuração
  - H2: Referências de segredos versus strings ${ENV}
  - H2: Variáveis de ambiente relacionadas a caminhos
  - H2: Registro
  - H3: OPENCLAWHOME
  - H2: Usuários do nvm: falhas de TLS do webfetch
  - H2: Variáveis de ambiente legadas
  - H2: Relacionados

## help/faq-first-run.md

- Rota: /help/faq-first-run
- Títulos:
  - H2: Início rápido e configuração da primeira execução
  - H2: Relacionados

## help/faq-models.md

- Rota: /help/faq-models
- Títulos:
  - H2: Modelos: padrões, seleção, aliases e alternância
  - H2: Failover de modelos e “Todos os modelos falharam”
  - H2: Perfis de autenticação: o que são e como gerenciá-los
  - H2: Relacionados

## help/faq.md

- Rota: /help/faq
- Títulos:
  - H2: Primeiros 60 segundos se algo não estiver funcionando
  - H2: Início rápido e configuração da primeira execução
  - H2: O que é o OpenClaw?
  - H2: Skills e automação
  - H2: Sandboxing e memória
  - H2: Onde os itens ficam armazenados no disco
  - H2: Noções básicas de configuração
  - H2: Gateways e Nodes remotos
  - H2: Variáveis de ambiente e carregamento de .env
  - H2: Sessões e vários chats
  - H2: Modelos, failover e perfis de autenticação
  - H2: Gateway: portas, "já está em execução" e modo remoto
  - H2: Logs e depuração
  - H2: Mídia e anexos
  - H2: Segurança e controle de acesso
  - H2: Comandos de chat, cancelamento de tarefas e "não para"
  - H2: Diversos
  - H2: Conteúdo relacionado

## help/index.md

- Rota: /help
- Títulos:
  - H2: Perguntas frequentes
  - H2: Diagnóstico
  - H2: Testes
  - H2: Comunidade e metainformações

## help/scripts.md

- Rota: /help/scripts
- Títulos:
  - H2: Convenções
  - H2: Scripts de monitoramento de autenticação
  - H2: Auxiliar de leitura do GitHub
  - H2: Ao adicionar scripts
  - H2: Conteúdo relacionado

## help/testing-live.md

- Rota: /help/testing-live
- Títulos:
  - H2: Ao vivo: comandos locais de verificação básica
  - H2: Ao vivo: verificação abrangente dos recursos do Node Android
  - H2: Ao vivo: verificação básica de modelos (chaves de perfil)
  - H3: Camada 1: conclusão direta do modelo (sem Gateway)
  - H3: Camada 2: Gateway + verificação básica do agente de desenvolvimento (o que "@openclaw" realmente faz)
  - H2: Ao vivo: verificação básica do backend da CLI (Claude, Gemini ou outras CLIs locais)
  - H2: Ao vivo: acessibilidade do proxy HTTP/2 do APNs
  - H2: Ao vivo: verificação básica de vinculação do ACP (/acp spawn ... --bind here)
  - H2: Ao vivo: verificação básica do harness do servidor de aplicativos do Codex
  - H3: Procedimentos recomendados para testes ao vivo
  - H2: Ao vivo: matriz de modelos (o que abrangemos)
  - H3: Agregadores/gateways alternativos
  - H2: Credenciais (nunca faça commit)
  - H2: Deepgram ao vivo (transcrição de áudio)
  - H2: Plano de programação do BytePlus ao vivo
  - H2: Mídia de fluxo de trabalho do ComfyUI ao vivo
  - H2: Geração de imagens ao vivo
  - H2: Geração de música ao vivo
  - H2: Geração de vídeo ao vivo
  - H2: Harness de mídia ao vivo
  - H2: Conteúdo relacionado

## help/testing-updates-plugins.md

- Rota: /help/testing-updates-plugins
- Títulos:
  - H2: O que protegemos
  - H2: Comprovação local durante o desenvolvimento
  - H2: Fluxos do Docker
  - H2: Aceitação de pacotes
  - H2: Padrão da versão
  - H2: Compatibilidade legada
  - H2: Como adicionar cobertura
  - H2: Triagem de falhas

## help/testing.md

- Rota: /help/testing
- Títulos:
  - H2: Início rápido
  - H2: Diretórios temporários de teste
  - H2: Fluxos de trabalho ao vivo e com Docker/Parallels
  - H2: Executores específicos de QA
  - H3: Credenciais compartilhadas do Telegram por meio do Convex (v1)
  - H3: Como adicionar um canal ao QA
  - H2: Suítes de testes (o que é executado onde)
  - H3: Unidade/integração (padrão)
  - H3: Estabilidade (Gateway)
  - H3: E2E (agregado do repositório)
  - H3: E2E (verificação básica do Gateway)
  - H3: E2E (navegador simulado da interface de controle)
  - H3: E2E: verificação básica do backend OpenShell
  - H3: Ao vivo (provedores e modelos reais)
  - H2: Qual suíte devo executar?
  - H2: Testes ao vivo (com acesso à rede)
  - H2: Executores do Docker (verificações opcionais de "funcionamento no Linux")
  - H2: Validação básica da documentação
  - H2: Regressão offline (segura para CI)
  - H2: Avaliações de confiabilidade do agente (Skills)
  - H2: Testes de contrato (formato de plugins e canais)
  - H3: Comandos
  - H3: Contratos de canais
  - H3: Contratos de provedores
  - H3: Quando executar
  - H2: Como adicionar regressões (orientações)
  - H2: Conteúdo relacionado

## help/troubleshooting.md

- Rota: /help/troubleshooting
- Títulos:
  - H2: Primeiros 60 segundos
  - H2: O assistente parece limitado ou sem ferramentas
  - H2: Erro 429 de contexto longo da Anthropic
  - H2: O backend local compatível com OpenAI funciona diretamente, mas falha no OpenClaw
  - H2: A instalação do plugin falha devido à ausência de extensões do OpenClaw
  - H2: A política de instalação bloqueia instalações ou atualizações de plugins
  - H2: O plugin está presente, mas foi bloqueado por propriedade suspeita
  - H2: Árvore de decisão
  - H2: Conteúdo relacionado

## index.md

- Rota: /
- Títulos:
  - H1: OpenClaw 🦞
  - H2: Explore a documentação
  - H2: O que é o OpenClaw?
  - H2: Como funciona
  - H2: Principais recursos
  - H2: Início rápido
  - H2: Painel
  - H2: Configuração (opcional)
  - H2: Comece aqui
  - H2: Saiba mais

## install/ansible.md

- Rota: /install/ansible
- Títulos:
  - H2: Pré-requisitos
  - H2: O que você obtém
  - H2: Início rápido
  - H2: O que é instalado
  - H2: Configuração pós-instalação
  - H3: Comandos rápidos
  - H2: Arquitetura de segurança
  - H2: Instalação manual
  - H2: Atualização
  - H2: Solução de problemas
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## install/azure.md

- Rota: /install/azure
- Títulos:
  - H2: O que você fará
  - H2: O que é necessário
  - H2: Configurar a implantação
  - H2: Implantar recursos do Azure
  - H2: Instalar o OpenClaw
  - H2: Considerações sobre custos
  - H2: Limpeza
  - H2: Próximas etapas
  - H2: Conteúdo relacionado

## install/bun.md

- Rota: /install/bun
- Títulos:
  - H2: Instalação
  - H2: Scripts de ciclo de vida
  - H2: Ressalvas
  - H2: Conteúdo relacionado

## install/clawdock.md

- Rota: /install/clawdock
- Títulos:
  - H2: Instalação
  - H2: O que você obtém
  - H3: Operações básicas
  - H3: Acesso ao contêiner
  - H3: Interface web e emparelhamento
  - H3: Configuração e manutenção
  - H3: Utilitários
  - H2: Fluxo da primeira execução
  - H2: Configuração e segredos
  - H2: Conteúdo relacionado

## install/development-channels.md

- Rota: /install/development-channels
- Títulos:
  - H2: Alternância de canais
  - H2: Direcionamento pontual para uma versão ou tag
  - H2: Simulação
  - H2: Plugins e canais
  - H2: Verificação do status atual
  - H2: Práticas recomendadas de criação de tags
  - H2: Disponibilidade do aplicativo para macOS
  - H2: Conteúdo relacionado

## install/digitalocean.md

- Rota: /install/digitalocean
- Títulos:
  - H2: Pré-requisitos
  - H2: Configuração
  - H2: Persistência e backups
  - H2: Dicas para 1 GB de RAM
  - H2: Solução de problemas
  - H2: Próximas etapas
  - H2: Conteúdo relacionado

## install/docker-vm-runtime.md

- Rota: /install/docker-vm-runtime
- Títulos:
  - H2: Incorporar os binários necessários à imagem
  - H2: Compilar e iniciar
  - H2: O que persiste e onde
  - H2: Atualizações
  - H2: Conteúdo relacionado

## install/docker.md

- Rota: /install/docker
- Títulos:
  - H2: Pré-requisitos
  - H2: Gateway em contêiner
  - H3: Fluxo manual
  - H3: Atualização das imagens de contêiner
  - H3: Variáveis de ambiente
  - H3: Imagens compiladas do código-fonte com plugins selecionados
  - H3: Observabilidade
  - H3: Verificações de integridade
  - H3: LAN versus loopback
  - H3: Provedores locais do host
  - H3: Backend da CLI do Claude no Docker
  - H3: Bonjour/mDNS
  - H3: Armazenamento e persistência
  - H3: Auxiliares de shell (opcional)
  - H3: Executando em uma VPS?
  - H2: Sandbox do agente
  - H3: Ativação rápida
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## install/exe-dev.md

- Rota: /install/exe-dev
- Títulos:
  - H2: O que é necessário
  - H2: Caminho rápido para iniciantes
  - H2: Instalação automatizada com o Shelley
  - H2: Instalação manual
  - H2: Configuração de canal remoto
  - H2: Acesso remoto
  - H2: Atualização
  - H2: Conteúdo relacionado

## install/fly.md

- Rota: /install/fly
- Títulos:
  - H2: O que é necessário
  - H2: Caminho rápido para iniciantes
  - H2: Solução de problemas
  - H3: "O aplicativo não está escutando no endereço esperado"
  - H3: Falha nas verificações de integridade/conexão recusada
  - H3: OOM/problemas de memória
  - H3: Problemas de bloqueio do Gateway
  - H3: A configuração não está sendo lida
  - H3: Gravação da configuração via SSH
  - H3: O estado não está persistindo
  - H2: Atualização
  - H3: Atualização do comando da máquina
  - H2: Implantação privada (reforçada)
  - H3: Quando usar uma implantação privada
  - H3: Configuração
  - H3: Acesso a uma implantação privada
  - H3: Webhooks com implantação privada
  - H3: Compromissos de segurança
  - H2: Observações
  - H2: Custo
  - H2: Próximas etapas
  - H2: Conteúdo relacionado

## install/gcp.md

- Rota: /install/gcp
- Títulos:
  - H2: O que é necessário
  - H2: Caminho rápido
  - H2: Solução de problemas
  - H2: Contas de serviço (prática recomendada de segurança)
  - H2: Próximas etapas
  - H2: Conteúdo relacionado

## install/hetzner.md

- Rota: /install/hetzner
- Títulos:
  - H2: O que é necessário
  - H2: Caminho rápido
  - H2: Infraestrutura como código (Terraform)
  - H2: Próximas etapas
  - H2: Conteúdo relacionado

## install/hostinger.md

- Rota: /install/hostinger
- Títulos:
  - H2: Pré-requisitos
  - H2: Opção A: OpenClaw com 1 clique
  - H2: Opção B: OpenClaw em uma VPS
  - H2: Verifique sua configuração
  - H2: Solução de problemas
  - H2: Próximas etapas
  - H2: Conteúdo relacionado

## install/index.md

- Rota: /install
- Títulos:
  - H2: Requisitos do sistema
  - H2: Recomendado: script de instalação
  - H2: Métodos alternativos de instalação
  - H3: Instalador com prefixo local (install-cli.sh)
  - H3: npm, pnpm ou bun
  - H3: A partir do código-fonte
  - H3: Instalação a partir do checkout principal do GitHub
  - H3: Contêineres e gerenciadores de pacotes
  - H2: Verificar a instalação
  - H2: Hospedagem e implantação
  - H2: Atualizar, migrar ou desinstalar
  - H2: Solução de problemas: openclaw não encontrado

## install/installer.md

- Rota: /install/installer
- Títulos:
  - H2: Comandos rápidos
  - H2: install.sh
  - H3: Fluxo (install.sh)
  - H3: Detecção de checkout do código-fonte
  - H3: Exemplos (install.sh)
  - H2: install-cli.sh
  - H3: Fluxo (install-cli.sh)
  - H3: Exemplos (install-cli.sh)
  - H2: install.ps1
  - H3: Fluxo (install.ps1)
  - H3: Exemplos (install.ps1)
  - H2: CI e automação
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## install/kubernetes.md

- Rota: /install/kubernetes
- Títulos:
  - H2: Por que não usar o Helm
  - H2: O que é necessário
  - H2: Início rápido
  - H2: Testes locais com o Kind
  - H2: Passo a passo
  - H3: 1) Implantar
  - H3: 2) Acessar o Gateway
  - H2: O que é implantado
  - H2: Personalização
  - H3: Instruções do agente
  - H3: Configuração do Gateway
  - H3: Adicionar provedores
  - H3: Namespace personalizado
  - H3: Imagem personalizada
  - H3: Expor além do encaminhamento de porta
  - H2: Reimplantar
  - H2: Desmontagem
  - H2: Observações sobre a arquitetura
  - H2: Estrutura de arquivos
  - H2: Conteúdo relacionado

## install/macos-vm.md

- Rota: /install/macos-vm
- Títulos:
  - H2: Padrão recomendado (maioria dos usuários)
  - H2: Opções de VM do macOS
  - H3: VM local no seu Mac com Apple Silicon (Lume)
  - H3: Provedores de Mac hospedado (nuvem)
  - H2: Caminho rápido (Lume, usuários experientes)
  - H2: O que é necessário (Lume)
  - H2: 1) Instalar o Lume
  - H2: 2) Criar a VM do macOS
  - H2: 3) Concluir o Assistente de Configuração
  - H2: 4) Obter o endereço IP da VM
  - H2: 5) Acessar a VM via SSH
  - H2: 6) Instalar o OpenClaw
  - H2: 7) Configurar canais
  - H2: 8) Executar a VM sem interface gráfica
  - H2: Bônus: integração com o iMessage
  - H2: Salvar uma imagem mestre
  - H2: Execução ininterrupta
  - H2: Solução de problemas
  - H2: Documentação relacionada

## install/migrating-claude.md

- Rota: /install/migrating-claude
- Títulos:
  - H2: Duas formas de importar
  - H2: O que é importado
  - H2: O que permanece somente no arquivo
  - H2: Seleção da origem
  - H2: Fluxo recomendado
  - H2: Tratamento de conflitos
  - H2: Saída JSON para automação
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## install/migrating-hermes.md

- Rota: /install/migrating-hermes
- Títulos:
  - H2: Duas formas de importar
  - H2: O que é importado
  - H2: O que permanece somente no arquivo
  - H2: Fluxo recomendado
  - H2: Tratamento de conflitos
  - H2: Segredos
  - H2: Saída JSON para automação
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## install/migrating.md

- Rota: /install/migrating
- Títulos:
  - H2: Importar de outro sistema de agentes
  - H2: Mover o OpenClaw para uma nova máquina
  - H3: Etapas da migração
  - H3: Armadilhas comuns
  - H3: Lista de verificação
  - H2: Atualizar um plugin no local
  - H2: Conteúdo relacionado

## install/nix.md

- Rota: /install/nix
- Títulos:
  - H2: O que você obtém
  - H2: Início rápido
  - H2: Comportamento do runtime no modo Nix
  - H3: O que muda no modo Nix
  - H3: Caminhos de configuração e estado
  - H3: Descoberta do PATH do serviço
  - H2: Conteúdo relacionado

## install/node.md

- Rota: /install/node
- Títulos:
  - H2: Verifique sua versão
  - H2: Instalar o Node
  - H2: Solução de problemas
  - H3: openclaw: comando não encontrado
  - H3: Erros de permissão em npm install -g (Linux)
  - H2: Conteúdo relacionado

## install/northflank.mdx

- Rota: /install/northflank
- Títulos:
  - H2: Como começar
  - H2: O que você obtém
  - H2: Conectar um canal
  - H2: Próximas etapas

## install/oracle.md

- Rota: /install/oracle
- Títulos:
  - H2: Pré-requisitos
  - H2: Configuração
  - H2: Verificar a postura de segurança
  - H2: Observações sobre ARM
  - H2: Persistência e backups
  - H2: Alternativa: túnel SSH
  - H2: Solução de problemas
  - H2: Próximas etapas
  - H2: Conteúdo relacionado

## install/podman.md

- Rota: /install/podman
- Títulos:
  - H2: Pré-requisitos
  - H2: Início rápido
  - H2: Podman e Tailscale
  - H2: Systemd (Quadlet, opcional)
  - H2: Configuração, ambiente e armazenamento
  - H2: Atualização de imagens
  - H2: Comandos úteis
  - H2: Solução de problemas
  - H2: Relacionados

## install/railway.mdx

- Rota: /install/railway
- Títulos:
  - H2: Implantação com um clique
  - H2: O que você recebe
  - H2: Conectar um canal
  - H2: Backups e migração
  - H2: Próximas etapas

## install/raspberry-pi.md

- Rota: /install/raspberry-pi
- Títulos:
  - H2: Compatibilidade de hardware
  - H2: Pré-requisitos
  - H2: Configuração
  - H2: Dicas de desempenho
  - H2: Configuração de modelo recomendada
  - H2: Observações sobre binários ARM
  - H2: Persistência e backups
  - H2: Solução de problemas
  - H2: Próximas etapas
  - H2: Relacionados

## install/render.mdx

- Rota: /install/render
- Títulos:
  - H2: Pré-requisitos
  - H2: Implantação
  - H2: O Blueprint
  - H2: Escolha de um plano
  - H2: Após a implantação
  - H3: Acessar a interface de controle
  - H3: Logs
  - H3: Acesso ao shell
  - H3: Variáveis de ambiente
  - H3: Implantação automática
  - H2: Domínio personalizado
  - H2: Escalabilidade
  - H2: Backups e migração
  - H2: Solução de problemas
  - H3: O serviço não inicia
  - H3: Inicializações a frio lentas (plano gratuito)
  - H3: Perda de dados após nova implantação
  - H3: Falhas na verificação de integridade
  - H2: Próximas etapas

## install/uninstall.md

- Rota: /install/uninstall
- Títulos:
  - H2: Caminho fácil (CLI ainda instalada)
  - H2: Remoção manual do serviço (CLI não instalada)
  - H3: macOS (launchd)
  - H3: Linux (unidade de usuário do systemd)
  - H3: Windows (Tarefa Agendada)
  - H2: Instalação normal versus checkout do código-fonte
  - H3: Instalação normal (install.sh / npm / pnpm / bun)
  - H3: Checkout do código-fonte (git clone)
  - H2: Relacionados

## install/updating.md

- Rota: /install/updating
- Títulos:
  - H2: Recomendado: openclaw update
  - H2: Alternar entre instalações via npm e git
  - H2: Alternativa: executar novamente o instalador
  - H2: Alternativa: npm, pnpm ou bun manualmente
  - H3: Tópicos avançados de instalação com npm
  - H2: Atualizador automático
  - H2: Após a atualização
  - H3: Executar o doctor
  - H3: Reiniciar o Gateway
  - H3: Verificar
  - H2: Reversão
  - H3: Fixar uma versão (npm)
  - H3: Fixar um commit (código-fonte)
  - H2: Se você estiver com dificuldades
  - H2: Relacionados

## install/upstash.md

- Rota: /install/upstash
- Títulos:
  - H2: Pré-requisitos
  - H2: Criar uma Box
  - H2: Conectar com um túnel SSH
  - H2: Instalar o OpenClaw
  - H2: Executar a integração inicial
  - H2: Iniciar o Gateway
  - H2: Reinicialização automática
  - H2: Solução de problemas
  - H2: Relacionados

## logging.md

- Rota: /logging
- Títulos:
  - H2: Onde os logs ficam
  - H2: Como ler os logs
  - H3: CLI: acompanhamento em tempo real (recomendado)
  - H3: Interface de controle (web)
  - H3: Logs somente do canal
  - H2: Formatos de log
  - H3: Logs em arquivo (JSONL)
  - H3: Saída do console
  - H3: Logs do WebSocket do Gateway
  - H2: Configuração de logs
  - H3: Níveis de log
  - H3: Diagnóstico direcionado do transporte do modelo
  - H3: Correlação de rastreamento
  - H3: Tamanho e duração das chamadas ao modelo
  - H3: Estilos do console
  - H3: Remoção de dados confidenciais
  - H2: Diagnóstico e OpenTelemetry
  - H2: Dicas para solução de problemas
  - H2: Relacionados

## maturity/scorecard.md

- Rota: /maturity/scorecard
- Títulos:
  - H1: Quadro de avaliação de maturidade
  - H2: Finalidade desta página
  - H2: Visão geral
  - H2: Faixas de pontuação
  - H2: Explorador de superfícies
  - H2: Resumo das evidências de QA
  - H3: Prontidão por área

## maturity/taxonomy.md

- Rota: /maturity/taxonomy
- Títulos:
  - H1: Taxonomia de maturidade
  - H2: Como ler esta página
  - H2: Níveis de maturidade
  - H2: Áreas do produto
  - H2: Detalhes
  - H3: Núcleo
  - H3: Plataforma
  - H3: Canal
  - H3: Provedor e ferramenta

## network.md

- Rota: /network
- Títulos:
  - H2: Modelo central
  - H2: Emparelhamento e identidade
  - H2: Descoberta e transportes
  - H2: Nodes e transportes
  - H2: Segurança
  - H2: Relacionados

## nodes/audio.md

- Rota: /nodes/audio
- Títulos:
  - H2: O que faz
  - H2: Detecção automática (padrão)
  - H2: Exemplos de configuração
  - H3: Provedor e fallback para CLI (OpenAI + CLI do Whisper)
  - H3: Somente provedor com controle de escopo
  - H3: Somente provedor (Deepgram)
  - H3: Somente provedor (Mistral Voxtral)
  - H3: Somente provedor (SenseAudio)
  - H3: Reproduzir a transcrição no chat (opcional)
  - H2: Observações e limites
  - H3: STT local residente
  - H3: Compatibilidade com ambiente de proxy
  - H2: Detecção de menções em grupos
  - H2: Pontos de atenção
  - H2: Relacionados

## nodes/camera.md

- Rota: /nodes/camera
- Títulos:
  - H2: Node iOS
  - H3: Configuração do usuário no iOS
  - H3: Comandos do iOS (via Gateway node.invoke)
  - H3: Requisito de execução em primeiro plano no iOS
  - H3: Auxiliar da CLI
  - H2: Node Android
  - H3: Configuração do usuário no Android
  - H3: Permissões
  - H3: Requisito de execução em primeiro plano no Android
  - H3: Comandos do Android (via Gateway node.invoke)
  - H2: Aplicativo para macOS
  - H3: Configuração do usuário no macOS
  - H3: Auxiliar da CLI (node invoke)
  - H2: Segurança e limites práticos
  - H2: Vídeo da tela no macOS (nível do sistema operacional)
  - H2: Relacionados

## nodes/computer-use.md

- Rota: /nodes/computer-use
- Títulos:
  - H2: Requisitos
  - H2: A ferramenta de agente de computador
  - H2: O comando de Node computer.act
  - H2: Habilitar e armar
  - H2: Segurança
  - H2: Relação com outros caminhos de controle da área de trabalho

## nodes/images.md

- Rota: /nodes/images
- Títulos:
  - H2: Objetivos
  - H2: Superfície da CLI
  - H2: Comportamento do canal WhatsApp Web
  - H2: Pipeline de resposta automática
  - H2: Mídia recebida para comandos
  - H2: Limites e erros
  - H2: Observações para testes
  - H2: Relacionados

## nodes/index.md

- Rota: /nodes
- Títulos:
  - H2: Emparelhamento e status
  - H2: Divergência de versões e ordem de atualização
  - H2: Host de Node remoto (system.run)
  - H3: Iniciar um host de Node (primeiro plano)
  - H3: Gateway remoto por túnel SSH (vinculação de loopback)
  - H3: Iniciar um host de Node (serviço)
  - H3: Emparelhar e nomear
  - H3: Servidores MCP hospedados no Node
  - H3: Skills hospedadas no Node
  - H3: Estado de identidade sem interface gráfica
  - H3: Adicionar os comandos à lista de permissões
  - H3: Direcionar a execução para o Node
  - H3: Inferência de modelo local
  - H3: Sessões e transcrições do Codex
  - H3: Sessões e transcrições do Claude
  - H2: Invocação de comandos
  - H2: Política de comandos
  - H2: Configuração (openclaw.json)
  - H2: Capturas de tela (instantâneos do canvas)
  - H3: Controles do canvas
  - H3: A2UI (Canvas)
  - H2: Fotos e vídeos (câmera do Node)
  - H2: Gravações de tela (Nodes)
  - H2: Localização (Nodes)
  - H2: SMS (Nodes Android)
  - H2: Comandos de dispositivo e dados pessoais
  - H2: Comandos do sistema (host de Node / Node Mac)
  - H2: Vinculação do Node de execução
  - H2: Mapa de permissões
  - H2: Host de Node sem interface gráfica (multiplataforma)
  - H2: Modo de Node Mac

## nodes/location-command.md

- Rota: /nodes/location-command
- Títulos:
  - H2: Resumo
  - H2: Por que um seletor (e não apenas um interruptor)
  - H2: Modelo de configurações
  - H2: Mapeamento de permissões (node.permissions)
  - H2: Comando: location.get
  - H2: Comportamento em segundo plano
  - H2: Integração com modelo e ferramentas
  - H2: Texto da experiência do usuário (sugerido)
  - H2: Relacionados

## nodes/media-understanding.md

- Rota: /nodes/media-understanding
- Títulos:
  - H2: Como funciona
  - H2: Configuração
  - H3: Entradas de modelo
  - H3: Credenciais do provedor
  - H2: Regras e comportamento
  - H3: Detecção automática (padrão)
  - H3: Compatibilidade com proxy (chamadas ao provedor de áudio/vídeo)
  - H2: Recursos
  - H2: Matriz de compatibilidade de provedores
  - H2: Orientações para seleção de modelo
  - H2: Política de anexos
  - H3: Extração de anexos de arquivo
  - H2: Exemplos de configuração
  - H2: Saída de status
  - H2: Observações
  - H2: Relacionados

## nodes/presence.md

- Rota: /nodes/presence
- Títulos:
  - H2: Requisitos
  - H2: Verificar o computador ativo
  - H2: Como a atividade se torna presença
  - H2: Privacidade e contexto do modelo
  - H2: Como os alertas de conexão são encaminhados
  - H2: Solução de problemas
  - H2: Relacionados

## nodes/talk.md

- Rota: /nodes/talk
- Títulos:
  - H2: Comportamento (macOS)
  - H2: Diretivas de voz nas respostas
  - H2: Configuração (/.openclaw/openclaw.json)
  - H2: Interface do macOS
  - H2: Interface do Android
  - H2: Observações
  - H2: Relacionados

## nodes/troubleshooting.md

- Rota: /nodes/troubleshooting
- Títulos:
  - H2: Sequência de comandos
  - H2: Requisitos de execução em primeiro plano
  - H2: Matriz de permissões
  - H2: Emparelhamento versus aprovações
  - H2: Códigos de erro comuns de Node
  - H2: Ciclo de recuperação rápida
  - H2: Relacionados

## nodes/voicewake.md

- Rota: /nodes/voicewake
- Títulos:
  - H2: Armazenamento
  - H2: Protocolo
  - H3: Lista de acionadores
  - H3: Encaminhamento (do acionador para o destino)
  - H3: Eventos
  - H2: Comportamento do cliente
  - H2: Relacionados

## openclaw-agent-runtime.md

- Rota: /openclaw-agent-runtime
- Títulos:
  - H2: Verificação de tipos e lint
  - H2: Execução dos testes do runtime do agente
  - H2: Testes manuais
  - H2: Redefinição para um estado limpo
  - H2: Referências
  - H2: Relacionados

## perplexity.md

- Rota: /perplexity
- Títulos:
  - H2: Relacionados

## plan/cloud-workers.md

- Rota: /plan/cloud-workers
- Títulos:
  - H2: Status
  - H2: Problema
  - H2: Objetivos
  - H2: Fora do escopo (v1)
  - H2: Trabalhos anteriores (o que copiamos e o que invertemos)
  - H2: Decisão de arquitetura: ciclo no worker, inferência pelo Gateway
  - H2: Componentes
  - H3: 1. Máquina de estados do ambiente e contrato do provedor
  - H3: 2. Inicialização do worker: instalar o OpenClaw na máquina
  - H3: 3. Transporte: tudo por SSH
  - H3: 4. Protocolo do worker (dedicado; não é o protocolo do Node)
  - H3: 5. RPCs do backend de sessão
  - H3: 6. Sincronização do espaço de trabalho
  - H3: 7. Máquina de estados de posicionamento, sessões e interface
  - H2: Despacho e transferência
  - H2: Modelo de segurança
  - H2: Capacidade
  - H2: Ciclo de vida
  - H2: Superfície de configuração
  - H2: Marcos
  - H2: Questões em aberto

## plan/path3-sqlite-session-artifact-family.md

- Rota: /plan/path3-sqlite-session-artifact-family
- Títulos:
  - H1: Família de artefatos de sessão SQLite do caminho 3
  - H2: Família autoritativa
  - H2: Artefatos fora da família após a transição
  - H2: Pontos de alteração
  - H2: Testes direcionados

## plan/ui-channels.md

- Rota: /plan/ui-channels
- Títulos:
  - H2: Status
  - H2: Problema
  - H2: Objetivos
  - H2: Fora do escopo
  - H2: Modelo de destino
  - H2: Metadados de entrega
  - H2: Contrato de recursos do runtime
  - H2: Mapeamento de canais
  - H2: Etapas de refatoração
  - H2: Testes
  - H2: Questões em aberto
  - H2: Relacionados

## platforms/android.md

- Rota: /platforms/android
- Títulos:
  - H2: Visão geral da compatibilidade
  - H2: Instalação fora do Google Play
  - H2: Espelhar e controlar o Android de um Mac remoto
  - H3: Antes de começar
  - H3: Habilitar ADB sobre TCP
  - H3: Permitir somente o Mac controlador
  - H3: Conectar e iniciar o espelhamento
  - H3: Solução de problemas
  - H2: Guia operacional de conexão
  - H3: Pré-requisitos
  - H3: 1. Iniciar o Gateway
  - H3: 2. Verificar a descoberta (opcional)
  - H4: Descoberta entre redes via DNS-SD unicast
  - H3: 3. Conectar pelo Android
  - H3: Vários gateways
  - H3: Sinalizadores periódicos de presença
  - H3: 4. Aprovar o emparelhamento (CLI)
  - H3: 5. Verificar se o Node está conectado
  - H3: 6. Chat e histórico
  - H3: 7. Canvas e câmera
  - H4: Host de Canvas do Gateway (recomendado para conteúdo web)
  - H3: 8. Voz e superfície expandida de comandos do Android
  - H3: 9. Arquivos do espaço de trabalho (somente leitura)
  - H2: Revisar aprovações de comandos
  - H2: Pontos de entrada do assistente
  - H2: Encaminhamento de notificações
  - H2: Relacionados

## platforms/digitalocean.md

- Rota: /platforms/digitalocean
- Títulos:
  - H2: Relacionados

## platforms/easyrunner.md

- Rota: /platforms/easyrunner
- Títulos:
  - H2: Antes de começar
  - H2: Aplicativo Compose
  - H2: Configurar o OpenClaw
  - H2: Verificar
  - H2: Atualizações e backups
  - H2: Solução de problemas

## platforms/index.md

- Rota: /platforms
- Títulos:
  - H2: Escolha seu sistema operacional
  - H2: VPS e hospedagem
  - H2: Links comuns
  - H2: Instalação do serviço do Gateway (CLI)
  - H2: Relacionados

## platforms/ios.md

- Rota: /platforms/ios
- Títulos:
  - H2: O que faz
  - H2: Requisitos
  - H2: Início rápido (emparelhar e conectar)
  - H2: Revisar aprovações de comandos
  - H2: Node direto opcional no Apple Watch
  - H2: Push com suporte de retransmissão para builds oficiais
  - H2: Sinalizadores periódicos em segundo plano
  - H2: Fluxo de autenticação e confiança
  - H2: Caminhos de descoberta
  - H3: Bonjour (LAN)
  - H3: Tailnet (entre redes)
  - H3: Host/porta manual
  - H2: Vários gateways
  - H2: Canvas e A2UI
  - H2: Relação com o uso do computador
  - H3: Avaliação/instantâneo do Canvas
  - H2: Ativação por voz e modo de conversa
  - H2: Erros comuns
  - H2: Documentação relacionada

## platforms/linux.md

- Rota: /platforms/linux
- Títulos:
  - H2: Caminho rápido (VPS)
  - H2: Instalação
  - H2: Serviço do Gateway (systemd)
  - H2: Pressão de memória e encerramentos por OOM
  - H2: Relacionados

## platforms/mac/bundled-gateway.md

- Rota: /platforms/mac/bundled-gateway
- Títulos:
  - H2: Configuração automática
  - H2: Recuperação manual
  - H2: Launchd (Gateway como LaunchAgent)
  - H2: Compatibilidade de versões
  - H2: Diretório de estado no macOS
  - H2: Depuração da conectividade do aplicativo
  - H2: Verificação rápida
  - H2: Relacionados

## platforms/mac/canvas.md

- Rota: /platforms/mac/canvas
- Títulos:
  - H2: Onde o Canvas fica
  - H2: Comportamento do painel
  - H2: Superfície da API do agente
  - H2: A2UI no Canvas
  - H3: Comandos A2UI (v0.8)
  - H2: Acionamento de execuções do agente pelo Canvas
  - H2: Observações de segurança
  - H2: Relacionados

## platforms/mac/child-process.md

- Rota: /platforms/mac/child-process
- Títulos:
  - H2: Comportamento padrão (launchd)
  - H2: Builds de desenvolvimento não assinadas
  - H2: Modo somente anexação
  - H2: Modo remoto
  - H2: Por que preferimos o launchd
  - H2: Relacionados

## platforms/mac/dev-setup.md

- Rota: /platforms/mac/dev-setup
- Títulos:
  - H1: Configuração do ambiente de desenvolvimento no macOS
  - H2: Pré-requisitos
  - H2: 1. Instalar as dependências
  - H2: 2. Compilar e empacotar o aplicativo
  - H2: 3. Instalar a CLI e o Gateway
  - H2: Solução de problemas
  - H3: Falha na compilação: incompatibilidade da cadeia de ferramentas ou do SDK
  - H3: O aplicativo falha ao conceder uma permissão
  - H3: Gateway em "Starting..." indefinidamente
  - H2: Relacionados

## platforms/mac/health.md

- Rota: /platforms/mac/health
- Títulos:
  - H1: Verificações de integridade no macOS
  - H2: Barra de menus
  - H2: Configurações
  - H2: Como a sondagem funciona
  - H2: Em caso de dúvida
  - H2: Relacionados

## platforms/mac/icon.md

- Rota: /platforms/mac/icon
- Títulos:
  - H1: Estados do ícone da barra de menus
  - H2: Estados
  - H2: Orelhas da ativação por voz
  - H2: Formatos e tamanhos
  - H2: Observações sobre o comportamento
  - H2: Relacionados

## platforms/mac/logging.md

- Rota: /platforms/mac/logging
- Títulos:
  - H1: Registro em logs (macOS)
  - H2: Log rotativo em arquivo para diagnóstico (painel de depuração)
  - H2: Dados privados do sistema de logs unificado no macOS
  - H2: Ativar para o OpenClaw (ai.openclaw)
  - H2: Desativar após a depuração
  - H2: Relacionados

## platforms/mac/menu-bar.md

- Rota: /platforms/mac/menu-bar
- Títulos:
  - H2: O que é exibido
  - H2: Modelo de estado
  - H2: Enumeração IconState (Swift)
  - H3: ActivityKind -&gt; símbolo do indicador
  - H3: Mapeamento visual
  - H2: Submenu de contexto
  - H2: Texto da linha de status (menu)
  - H2: Ingestão de eventos
  - H2: Substituição para depuração
  - H2: Lista de verificação de testes
  - H2: Relacionados

## platforms/mac/peekaboo.md

- Rota: /platforms/mac/peekaboo
- Títulos:
  - H2: O que isto é (e o que não é)
  - H2: Relação com outros caminhos de controle da área de trabalho
  - H2: Ativar a ponte
  - H2: Ordem de descoberta do cliente
  - H2: Segurança e permissões
  - H2: Comportamento dos instantâneos (automação)
  - H2: Solução de problemas
  - H2: Relacionados

## platforms/mac/permissions.md

- Rota: /platforms/mac/permissions
- Títulos:
  - H2: Requisitos para permissões estáveis
  - H2: Concessões de acessibilidade para ambientes de execução Node e CLI
  - H2: Lista de verificação de recuperação quando as solicitações desaparecem
  - H2: Permissões de arquivos e pastas (Desktop/Documents/Downloads)
  - H2: Relacionados

## platforms/mac/remote.md

- Rota: /platforms/mac/remote
- Títulos:
  - H2: Modos
  - H2: Transportes remotos
  - H2: Pré-requisitos no host remoto
  - H2: Configuração do aplicativo para macOS
  - H2: Chat na Web
  - H2: Permissões
  - H2: Observações de segurança
  - H2: Fluxo de login do WhatsApp (remoto)
  - H2: Solução de problemas
  - H2: Sons de notificação
  - H2: Relacionados

## platforms/mac/signing.md

- Rota: /platforms/mac/signing
- Títulos:
  - H1: Assinatura no Mac (builds de depuração)
  - H2: Uso
  - H3: Observação sobre assinatura ad hoc
  - H2: Metadados da build para a seção Sobre
  - H2: Relacionados

## platforms/mac/skills.md

- Rota: /platforms/mac/skills
- Títulos:
  - H2: Fonte de dados
  - H2: Ações de instalação
  - H2: Variáveis de ambiente/chaves de API
  - H2: Modo remoto
  - H2: Relacionados

## platforms/mac/voice-overlay.md

- Rota: /platforms/mac/voice-overlay
- Títulos:
  - H1: Ciclo de vida da sobreposição de voz (macOS)
  - H2: Comportamento
  - H2: Implementação
  - H2: Registro em logs
  - H2: Lista de verificação de depuração
  - H2: Relacionados

## platforms/mac/voicewake.md

- Rota: /platforms/mac/voicewake
- Títulos:
  - H1: Ativação por voz e pressionar para falar
  - H2: Requisitos
  - H2: Modos
  - H2: Comportamento em tempo de execução (palavra de ativação)
  - H2: Invariantes do ciclo de vida
  - H2: Particularidades do pressionar para falar
  - H2: Configurações visíveis ao usuário
  - H2: Comportamento de encaminhamento
  - H2: Carga útil do encaminhamento
  - H2: Verificação rápida
  - H2: Relacionados

## platforms/mac/webchat.md

- Rota: /platforms/mac/webchat
- Títulos:
  - H2: Inicialização e depuração
  - H2: Como é conectado
  - H2: Superfície de segurança
  - H2: Limitações conhecidas
  - H2: Relacionados

## platforms/mac/xpc.md

- Rota: /platforms/mac/xpc
- Títulos:
  - H1: Arquitetura de IPC do OpenClaw no macOS
  - H2: Objetivos
  - H2: Como funciona
  - H3: Transporte entre Gateway e Node
  - H3: IPC entre o serviço Node e o aplicativo
  - H3: PeekabooBridge (automação da interface)
  - H2: Fluxos operacionais
  - H2: Observações de reforço de segurança
  - H2: Relacionados

## platforms/macos.md

- Rota: /platforms/macos
- Títulos:
  - H2: Download
  - H2: Primeira execução
  - H2: Atualizações
  - H2: Abrir links do painel
  - H2: Importar logins do navegador
  - H2: Escolher um modo do Gateway
  - H2: O que o aplicativo gerencia
  - H2: Páginas de detalhes do macOS
  - H2: Relacionados

## platforms/oracle.md

- Rota: /platforms/oracle
- Títulos:
  - H2: Relacionados

## platforms/raspberry-pi.md

- Rota: /platforms/raspberry-pi
- Títulos:
  - H2: Relacionados

## platforms/windows.md

- Rota: /platforms/windows
- Títulos:
  - H2: Recomendado: Windows Hub
  - H3: O que o Windows Hub inclui
  - H3: Primeira inicialização
  - H2: Modo Node do Windows
  - H2: Modo MCP local
  - H2: CLI e Gateway nativos do Windows
  - H2: Gateway no WSL2
  - H2: Inicialização automática do Gateway antes do login no Windows
  - H2: Expor serviços do WSL pela LAN
  - H2: Solução de problemas
  - H3: O ícone da bandeja não aparece
  - H3: Falha na configuração local
  - H3: O aplicativo informa que o pareamento é obrigatório
  - H3: O chat na Web não consegue acessar um Gateway remoto
  - H3: Os comandos screen.snapshot, camera ou audio falham
  - H3: Falha na conectividade com o Git ou o GitHub
  - H2: Relacionados

## plugins/adding-capabilities.md

- Rota: /plugins/adding-capabilities
- Títulos:
  - H2: Quando criar uma capacidade
  - H2: A sequência padrão
  - H2: O que deve ficar onde
  - H2: Pontos de integração do provedor e do harness
  - H2: Lista de verificação de arquivos
  - H2: Exemplo prático: geração de imagens
  - H2: Provedores de embeddings
  - H2: Lista de verificação da revisão
  - H2: Relacionados

## plugins/admin-http-rpc.md

- Rota: /plugins/admin-http-rpc
- Títulos:
  - H2: Antes de ativar
  - H2: Ativação
  - H2: Verificar a rota
  - H2: Autenticação
  - H2: Modelo de segurança
  - H2: Solicitação
  - H2: Resposta
  - H2: Métodos permitidos
  - H2: Comparação com WebSocket
  - H2: Solução de problemas
  - H2: Relacionados

## plugins/agent-tools.md

- Rota: /plugins/agent-tools
- Títulos:
  - H2: Relacionados

## plugins/architecture-internals.md

- Rota: /plugins/architecture-internals
- Títulos:
  - H2: Pipeline de carregamento
  - H3: Comportamento que prioriza o manifesto
  - H3: Limite do cache de Plugins
  - H2: Modelo de registro
  - H2: Callbacks de vinculação de conversas
  - H2: Hooks de tempo de execução do provedor
  - H3: Ordem e uso dos hooks
  - H3: Exemplo de provedor
  - H3: Exemplos integrados
  - H2: Auxiliares de tempo de execução
  - H3: api.runtime.imageGeneration
  - H2: Rotas HTTP do Gateway
  - H2: Caminhos de importação do SDK de Plugins
  - H2: Esquemas da ferramenta de mensagens
  - H2: Resolução do destino do canal
  - H2: Diretórios definidos pela configuração
  - H2: Catálogos de provedores
  - H2: Inspeção de canais somente leitura
  - H2: Pacotes de conteúdo
  - H3: Metadados do catálogo de canais
  - H2: Plugins de mecanismo de contexto
  - H2: Adicionar uma nova capacidade
  - H3: Lista de verificação de capacidades
  - H3: Modelo de capacidade
  - H2: Relacionados

## plugins/architecture.md

- Rota: /plugins/architecture
- Títulos:
  - H2: Modelo público de capacidades
  - H3: Posicionamento sobre compatibilidade externa
  - H3: Formatos de Plugin
  - H3: Hooks legados
  - H3: Sinais de compatibilidade
  - H2: Visão geral da arquitetura
  - H3: Instantâneo dos metadados de Plugins e tabela de consulta
  - H3: Planejamento da ativação
  - H3: Plugins de canal e a ferramenta compartilhada de mensagens
  - H2: Modelo de propriedade das capacidades
  - H3: Camadas de capacidades
  - H3: Exemplo de Plugin empresarial com várias capacidades
  - H3: Exemplo de capacidade: compreensão de vídeo
  - H2: Contratos e aplicação
  - H3: O que pertence a um contrato
  - H2: Modelo de execução
  - H2: Limite de exportação
  - H2: Componentes internos e referência
  - H2: Relacionados

## plugins/building-extensions.md

- Rota: /plugins/building-extensions
- Títulos:
  - H2: Relacionados

## plugins/building-plugins.md

- Rota: /plugins/building-plugins
- Títulos:
  - H2: Requisitos
  - H2: Escolher o formato do Plugin
  - H2: Início rápido
  - H2: Registro de ferramentas
  - H2: Convenções de importação
  - H2: Lista de verificação antes do envio
  - H2: Testar com versões beta
  - H2: Próximas etapas
  - H2: Relacionados

## plugins/bundles.md

- Rota: /plugins/bundles
- Títulos:
  - H2: Por que os pacotes existem
  - H2: Instalar um pacote
  - H2: O que o OpenClaw mapeia dos pacotes
  - H3: Compatível atualmente
  - H4: Conteúdo de Skills
  - H4: Pacotes de hooks
  - H4: MCP para o OpenClaw incorporado
  - H4: Configurações do OpenClaw incorporado
  - H4: LSP do OpenClaw incorporado
  - H3: Detectado, mas não executado
  - H2: Formatos de pacote
  - H2: Precedência de detecção
  - H2: Dependências de tempo de execução e limpeza
  - H2: Segurança
  - H2: Solução de problemas
  - H2: Relacionados

## plugins/cli-backend-plugins.md

- Rota: /plugins/cli-backend-plugins
- Títulos:
  - H2: O que o Plugin gerencia
  - H2: Plugin de backend mínimo
  - H2: Formato da configuração
  - H2: Hooks avançados de backend
  - H3: ownsNativeCompaction: desativar a Compaction do OpenClaw
  - H2: Ponte de ferramentas MCP
  - H2: Configuração do usuário
  - H2: Verificação
  - H2: Lista de verificação
  - H2: Relacionados

## plugins/codex-computer-use.md

- Rota: /plugins/codex-computer-use
- Títulos:
  - H2: OpenClaw.app e Peekaboo
  - H2: Aplicativo para iOS
  - H2: MCP direto do cua-driver
  - H2: Configuração rápida
  - H2: Comandos
  - H2: Opções do marketplace
  - H2: Marketplace integrado do macOS
  - H3: Cache compartilhado de Plugins
  - H2: Limite do catálogo remoto
  - H2: Referência de configuração
  - H2: O que o OpenClaw verifica
  - H2: Permissões do macOS
  - H2: Solução de problemas
  - H2: Relacionados

## plugins/codex-harness-reference.md

- Rota: /plugins/codex-harness-reference
- Títulos:
  - H2: Superfície de configuração do Plugin
  - H2: Supervisão
  - H2: Transporte do servidor de aplicativo
  - H2: Modos de aprovação e sandbox
  - H2: Execução nativa em sandbox
  - H2: Isolamento de autenticação e ambiente
  - H2: Ferramentas dinâmicas
  - H2: Tempos limite
  - H2: Descoberta de modelos
  - H2: Arquivos de inicialização do espaço de trabalho
  - H2: Substituições de ambiente
  - H2: Relacionados

## plugins/codex-harness-runtime.md

- Rota: /plugins/codex-harness-runtime
- Títulos:
  - H2: Visão geral
  - H2: Vinculações de threads e alterações de modelo
  - H2: Supervisão e continuação segura
  - H2: Respostas visíveis e Heartbeats
  - H2: Limites dos hooks
  - H2: Contrato de suporte da V1
  - H2: Permissões nativas e solicitações do MCP
  - H2: Direcionamento da fila
  - H2: Envio de feedback do Codex
  - H2: Compaction e espelho da transcrição
  - H2: Mídia e entrega
  - H2: Relacionados

## plugins/codex-harness.md

- Rota: /plugins/codex-harness
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Compartilhar threads com o Codex Desktop e a CLI
  - H2: Supervisionar sessões do Codex
  - H2: Configuração
  - H3: Compaction
  - H2: Verificar o ambiente de execução do Codex
  - H2: Roteamento e seleção de modelo
  - H2: Padrões de implantação
  - H3: Implantação básica do Codex
  - H3: Implantação com provedores mistos
  - H3: Implantação do Codex com falha segura
  - H2: Política do servidor de aplicativo
  - H2: Comandos e diagnósticos
  - H3: Inspecionar threads do Codex localmente
  - H3: Ordem de autenticação
  - H3: Isolamento de ambiente
  - H3: Ferramentas dinâmicas e pesquisa na Web
  - H3: Campos de configuração
  - H3: Tempos limite de chamadas de ferramentas dinâmicas
  - H3: Substituições de variáveis de ambiente para testes locais
  - H2: Plugins nativos do Codex
  - H2: Uso do computador
  - H2: Limites do ambiente de execução
  - H2: Solução de problemas
  - H2: Relacionados

## plugins/codex-native-plugins.md

- Rota: /plugins/codex-native-plugins
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Gerenciar plugins pelo chat
  - H2: Como funciona a configuração de plugins nativos
  - H2: Limites do suporte à V1
  - H2: Inventário e propriedade dos aplicativos
  - H2: Aplicativos de contas conectadas
  - H2: Configuração de aplicativos da conversa
  - H2: Política de ações destrutivas
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## plugins/codex-supervision.md

- Rota: /plugins/codex-supervision
- Títulos:
  - H2: Antes de começar
  - H2: Habilitar a supervisão
  - H2: Usar a CLI do operador
  - H2: Criar uma ramificação a partir de uma sessão local
  - H2: Arquivar uma sessão local
  - H2: Entender os limites de Nodes pareados
  - H2: Metadados e permissões
  - H3: Ferramentas de compatibilidade
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## plugins/community.md

- Rota: /plugins/community
- Títulos:
  - H2: Encontrar plugins
  - H2: Publicar plugins
  - H2: Conteúdo relacionado

## plugins/compatibility.md

- Rota: /plugins/compatibility
- Títulos:
  - H2: Registro de compatibilidade
  - H2: Política de descontinuação
  - H2: Áreas de compatibilidade atuais
  - H3: Aliases simples de callbacks de entrada do WhatsApp
  - H3: Campos de admissão de entrada do WhatsApp
  - H2: Pacote do inspetor de plugins
  - H3: Fluxo de aceitação do mantenedor
  - H2: Notas da versão

## plugins/copilot.md

- Rota: /plugins/copilot
- Títulos:
  - H2: Requisitos
  - H2: Instalação
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H2: BYOK
  - H2: Autenticação
  - H2: Superfície de configuração
  - H2: Compaction
  - H2: Espelhamento da transcrição
  - H2: Perguntas paralelas (/btw)
  - H2: Doctor
  - H2: Limitações
  - H2: Permissões e askuser
  - H3: Token do GitHub no nível da sessão
  - H2: Conteúdo relacionado

## plugins/dependency-resolution.md

- Rota: /plugins/dependency-resolution
- Títulos:
  - H2: Divisão de responsabilidades
  - H2: Raízes de instalação
  - H2: Plugins locais
  - H2: Inicialização e recarregamento
  - H2: Plugins incluídos
  - H2: Limpeza de componentes legados

## plugins/google-meet.md

- Rota: /plugins/google-meet
- Títulos:
  - H2: Início rápido
  - H3: Criar uma reunião
  - H3: Participar somente como observador
  - H3: Integridade da sessão em tempo real
  - H2: Gateway local + Chrome no Parallels
  - H3: Verificações de falhas comuns
  - H2: Notas de instalação
  - H2: Transportes
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth e pré-verificação
  - H3: Criar credenciais do Google
  - H3: Gerar o token de atualização
  - H3: Verificar o OAuth com o doctor
  - H3: Resolver, fazer a pré-verificação e ler artefatos
  - H3: Teste rápido em ambiente real
  - H3: Criar exemplos
  - H2: Configuração
  - H3: Padrões
  - H3: Substituições opcionais
  - H2: Ferramenta
  - H2: Modos de agente e bidirecional
  - H2: Lista de verificação para testes em ambiente real
  - H2: Solução de problemas
  - H3: O agente não consegue ver a ferramenta do Google Meet
  - H3: Nenhum Node conectado compatível com o Google Meet
  - H3: O navegador abre, mas o agente não consegue entrar
  - H3: Falha ao criar a reunião
  - H3: O agente entra, mas não fala
  - H3: As verificações de configuração do Twilio falham
  - H3: A chamada do Twilio começa, mas nunca entra na reunião
  - H2: Observações
  - H2: Conteúdo relacionado

## plugins/hooks.md

- Rota: /plugins/hooks
- Títulos:
  - H2: Início rápido
  - H2: Catálogo de hooks
  - H3: Solicitações de pareamento de canais
  - H2: Depurar hooks de runtime
  - H2: Política de chamadas de ferramentas
  - H3: Hook do ambiente de execução
  - H3: Persistência dos resultados de ferramentas
  - H2: Hooks de prompt e modelo
  - H3: Extensões de sessão e injeções no próximo turno
  - H2: Hooks de mensagens
  - H2: Hooks de instalação
  - H2: Ciclo de vida do Gateway
  - H3: Projeção segura de Cron externo
  - H2: Próximas descontinuações
  - H2: Conteúdo relacionado

## plugins/install-overrides.md

- Rota: /plugins/install-overrides
- Títulos:
  - H2: Ambiente
  - H2: Comportamento
  - H2: E2E do pacote

## plugins/llama-cpp.md

- Rota: /plugins/llama-cpp
- Títulos:
  - H2: Configuração
  - H2: Runtime nativo
  - H2: Diagnóstico do runtime
  - H2: Solução de problemas

## plugins/logbook.md

- Rota: /plugins/logbook
- Títulos:
  - H2: Antes de começar
  - H2: Início rápido
  - H2: Como funciona
  - H2: Fluxo de modelos e dados
  - H2: Configuração
  - H3: Seleção do modelo de visão
  - H2: Guia do painel
  - H2: Métodos do Gateway
  - H2: Observações sobre privacidade
  - H2: Solução de problemas
  - H3: A guia Logbook está ausente
  - H3: A captura relata um erro
  - H3: As capturas são concluídas, mas nenhum cartão aparece
  - H2: Conteúdo relacionado

## plugins/manage-plugins.md

- Rota: /plugins/manage-plugins
- Títulos:
  - H2: Usar a interface de controle
  - H2: Listar e pesquisar plugins
  - H2: Habilitar e desabilitar plugins
  - H2: Instalar plugins
  - H2: Reiniciar e inspecionar
  - H2: Atualizar plugins
  - H2: Desinstalar plugins
  - H2: Escolher uma origem
  - H2: Publicar plugins
  - H2: Conteúdo relacionado

## plugins/manifest.md

- Rota: /plugins/manifest
- Títulos:
  - H2: O que este arquivo faz
  - H2: Exemplo mínimo
  - H2: Exemplo completo
  - H2: Referência dos campos de nível superior
  - H2: Referência de catalog
  - H2: Referência dos metadados do provedor de geração
  - H2: Referência dos metadados de ferramentas
  - H2: Referência de providerAuthChoices
  - H2: Referência de commandAliases
  - H2: Referência de activation
  - H2: Referência de qaRunners
  - H2: Referência de setup
  - H3: Referência de setup.providers
  - H3: Campos de setup
  - H2: Referência de uiHints
  - H2: Referência de contracts
  - H2: Referência de configContracts
  - H2: Referência de mediaUnderstandingProviderMetadata
  - H2: Referência de channelConfigs
  - H3: Substituir outro Plugin de canal
  - H2: Referência de modelSupport
  - H2: Referência de modelCatalog
  - H2: Referência de modelIdNormalization
  - H2: Referência de providerEndpoints
  - H2: Referência de providerRequest
  - H2: Referência de secretProviderIntegrations
  - H2: Referência de modelPricing
  - H3: Índice de provedores do OpenClaw
  - H2: Manifesto versus package.json
  - H3: Campos de package.json que afetam a descoberta
  - H2: Precedência de descoberta (IDs de plugins duplicados)
  - H2: Requisitos do JSON Schema
  - H2: Comportamento da validação
  - H2: Observações
  - H2: Conteúdo relacionado

## plugins/memory-lancedb.md

- Rota: /plugins/memory-lancedb
- Títulos:
  - H2: Instalação
  - H2: Início rápido
  - H2: Configuração de embeddings
  - H3: Dimensões
  - H2: Embeddings do Ollama
  - H2: Limites de recuperação e captura
  - H2: Comandos
  - H2: Armazenamento
  - H2: Dependências de runtime e suporte a plataformas
  - H2: Solução de problemas
  - H3: O tamanho da entrada excede o tamanho do contexto
  - H3: Modelo de embedding não compatível
  - H3: O Plugin é carregado, mas nenhuma memória aparece
  - H2: Conteúdo relacionado

## plugins/memory-wiki.md

- Rota: /plugins/memory-wiki
- Títulos:
  - H2: Modos do cofre
  - H2: Estrutura do cofre
  - H2: Importações do Open Knowledge Format
  - H2: Afirmações estruturadas e evidências
  - H2: Metadados de entidades voltados para agentes
  - H2: Pipeline de compilação
  - H2: Painéis e relatórios de integridade
  - H2: Pesquisa e recuperação
  - H2: Ferramentas do agente
  - H2: Comportamento do prompt e do contexto
  - H2: Configuração
  - H3: Cofres por agente
  - H3: Exemplo: QMD + modo de ponte
  - H2: CLI
  - H2: Suporte ao Obsidian
  - H2: Fluxo de trabalho recomendado
  - H2: Documentação relacionada

## plugins/message-presentation.md

- Rota: /plugins/message-presentation
- Títulos:
  - H2: Contrato
  - H2: Exemplos de produtores
  - H2: Contrato do renderizador
  - H2: Fluxo de renderização do núcleo
  - H2: Regras de degradação
  - H3: Visibilidade do valor de fallback do botão
  - H2: Mapeamento de provedores
  - H2: Apresentação versus InteractiveReply
  - H2: Fixação da entrega
  - H2: Lista de verificação para autores de plugins
  - H2: Documentação relacionada

## plugins/oc-path.md

- Rota: /plugins/oc-path
- Títulos:
  - H2: Por que habilitá-lo
  - H2: Onde ele é executado
  - H2: Habilitar
  - H2: Dependências
  - H2: O que ele fornece
  - H2: Relação com outros plugins
  - H2: Segurança
  - H2: Conteúdo relacionado

## plugins/plugin-inventory.md

- Rota: /plugins/plugin-inventory
- Títulos:
  - H1: Inventário de plugins
  - H2: Definições
  - H2: Instalar um Plugin
  - H2: Pacote npm principal
  - H2: Pacotes externos oficiais
  - H2: Somente checkout do código-fonte

## plugins/plugin-permission-requests.md

- Rota: /plugins/plugin-permission-requests
- Títulos:
  - H2: Escolher o controle correto
  - H2: Solicitar aprovação antes de uma chamada de ferramenta
  - H2: Comportamento da decisão
  - H2: Encaminhar solicitações de aprovação
  - H2: Permissões nativas do Codex
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## plugins/reference.md

- Rota: /plugins/reference
- Títulos:
  - H1: Referência de plugins

## plugins/reference/acpx.md

- Rota: /plugins/reference/acpx
- Títulos:
  - H1: Plugin ACPx
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/admin-http-rpc.md

- Rota: /plugins/reference/admin-http-rpc
- Títulos:
  - H1: Plugin Admin Http Rpc
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/alibaba.md

- Rota: /plugins/reference/alibaba
- Títulos:
  - H1: Plugin Alibaba
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/amazon-bedrock-mantle.md

- Rota: /plugins/reference/amazon-bedrock-mantle
- Títulos:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/amazon-bedrock.md

- Rota: /plugins/reference/amazon-bedrock
- Títulos:
  - H1: Plugin Amazon Bedrock
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/anthropic-vertex.md

- Rota: /plugins/reference/anthropic-vertex
- Títulos:
  - H1: Plugin Anthropic Vertex
  - H2: Distribuição
  - H2: Superfície
  - H2: Claude Fable 5
  - H2: Claude Sonnet 5

## plugins/reference/anthropic.md

- Rota: /plugins/reference/anthropic
- Títulos:
  - H1: Plugin Anthropic
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/arcee.md

- Rota: /plugins/reference/arcee
- Títulos:
  - H1: Plugin Arcee
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/azure-speech.md

- Rota: /plugins/reference/azure-speech
- Títulos:
  - H1: Plugin Azure Speech
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/bonjour.md

- Rota: /plugins/reference/bonjour
- Títulos:
  - H1: Plugin Bonjour
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/brave.md

- Rota: /plugins/reference/brave
- Títulos:
  - H1: Plugin Brave
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/browser.md

- Rota: /plugins/reference/browser
- Títulos:
  - H1: Plugin de navegador
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/byteplus.md

- Rota: /plugins/reference/byteplus
- Títulos:
  - H1: Plugin BytePlus
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/canvas.md

- Rota: /plugins/reference/canvas
- Títulos:
  - H1: Plugin Canvas
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/cerebras.md

- Rota: /plugins/reference/cerebras
- Títulos:
  - H1: Plugin Cerebras
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/chutes.md

- Rota: /plugins/reference/chutes
- Títulos:
  - H1: Plugin Chutes
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/clawrouter.md

- Rota: /plugins/reference/clawrouter
- Títulos:
  - H1: Plugin ClawRouter
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/clickclack.md

- Rota: /plugins/reference/clickclack
- Títulos:
  - H1: Plugin Clickclack
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/cloudflare-ai-gateway.md

- Rota: /plugins/reference/cloudflare-ai-gateway
- Títulos:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/codex.md

- Rota: /plugins/reference/codex
- Títulos:
  - H1: Plugin Codex
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/cohere.md

- Rota: /plugins/reference/cohere
- Títulos:
  - H1: Plugin Cohere
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/comfy.md

- Rota: /plugins/reference/comfy
- Títulos:
  - H1: Plugin ComfyUI
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/copilot-proxy.md

- Rota: /plugins/reference/copilot-proxy
- Títulos:
  - H1: Plugin Copilot Proxy
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/copilot.md

- Rota: /plugins/reference/copilot
- Títulos:
  - H1: Plugin Copilot
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/crabbox.md

- Rota: /plugins/reference/crabbox
- Títulos:
  - H1: Plugin Crabbox
  - H2: Distribuição
  - H2: Superfície
  - H2: Configuração

## plugins/reference/deepgram.md

- Rota: /plugins/reference/deepgram
- Títulos:
  - H1: Plugin Deepgram
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/deepinfra.md

- Rota: /plugins/reference/deepinfra
- Títulos:
  - H1: Plugin DeepInfra
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/deepseek.md

- Rota: /plugins/reference/deepseek
- Títulos:
  - H1: Plugin DeepSeek
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/diagnostics-otel.md

- Rota: /plugins/reference/diagnostics-otel
- Títulos:
  - H1: Plugin de diagnóstico OpenTelemetry
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/diagnostics-prometheus.md

- Rota: /plugins/reference/diagnostics-prometheus
- Títulos:
  - H1: Plugin de diagnóstico Prometheus
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/diffs-language-pack.md

- Rota: /plugins/reference/diffs-language-pack
- Títulos:
  - H1: Plugin do pacote de idiomas Diffs
  - H2: Distribuição
  - H2: Superfície
  - H2: Idiomas adicionados

## plugins/reference/diffs.md

- Rota: /plugins/reference/diffs
- Títulos:
  - H1: Plugin Diffs
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/discord.md

- Rota: /plugins/reference/discord
- Títulos:
  - H1: Plugin Discord
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/document-extract.md

- Rota: /plugins/reference/document-extract
- Títulos:
  - H1: Plugin de extração de documentos
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/duckduckgo.md

- Rota: /plugins/reference/duckduckgo
- Títulos:
  - H1: Plugin DuckDuckGo
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/elevenlabs.md

- Rota: /plugins/reference/elevenlabs
- Títulos:
  - H1: Plugin Elevenlabs
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/exa.md

- Rota: /plugins/reference/exa
- Títulos:
  - H1: Plugin Exa
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/fal.md

- Rota: /plugins/reference/fal
- Títulos:
  - H1: Plugin Fal
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/featherless.md

- Rota: /plugins/reference/featherless
- Títulos:
  - H1: Plugin Featherless
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/feishu.md

- Rota: /plugins/reference/feishu
- Títulos:
  - H1: Plugin Feishu
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/file-transfer.md

- Rota: /plugins/reference/file-transfer
- Títulos:
  - H1: Plugin de transferência de arquivos
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/firecrawl.md

- Rota: /plugins/reference/firecrawl
- Títulos:
  - H1: Plugin Firecrawl
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/fireworks.md

- Rota: /plugins/reference/fireworks
- Títulos:
  - H1: Plugin Fireworks
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/github-copilot.md

- Rota: /plugins/reference/github-copilot
- Títulos:
  - H1: Plugin GitHub Copilot
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/gmi.md

- Rota: /plugins/reference/gmi
- Títulos:
  - H1: Plugin Gmi
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/google-meet.md

- Rota: /plugins/reference/google-meet
- Títulos:
  - H1: Plugin Google Meet
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/google.md

- Rota: /plugins/reference/google
- Títulos:
  - H1: Plugin Google
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/googlechat.md

- Rota: /plugins/reference/googlechat
- Títulos:
  - H1: Plugin Google Chat
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/gradium.md

- Rota: /plugins/reference/gradium
- Títulos:
  - H1: Plugin Gradium
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/groq.md

- Rota: /plugins/reference/groq
- Títulos:
  - H1: Plugin Groq
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/huggingface.md

- Rota: /plugins/reference/huggingface
- Títulos:
  - H1: Plugin Hugging Face
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/imessage.md

- Rota: /plugins/reference/imessage
- Títulos:
  - H1: Plugin iMessage
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/inworld.md

- Rota: /plugins/reference/inworld
- Títulos:
  - H1: Plugin Inworld
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/irc.md

- Rota: /plugins/reference/irc
- Títulos:
  - H1: Plugin IRC
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/kilocode.md

- Rota: /plugins/reference/kilocode
- Títulos:
  - H1: Plugin Kilocode
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/kimi.md

- Rota: /plugins/reference/kimi
- Títulos:
  - H1: Plugin Kimi
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/line.md

- Rota: /plugins/reference/line
- Títulos:
  - H1: Plugin LINE
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/litellm.md

- Rota: /plugins/reference/litellm
- Títulos:
  - H1: Plugin LiteLLM
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/llama-cpp.md

- Rota: /plugins/reference/llama-cpp
- Títulos:
  - H1: Plugin Llama Cpp
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/llm-task.md

- Rota: /plugins/reference/llm-task
- Títulos:
  - H1: Plugin de tarefa LLM
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/lmstudio.md

- Rota: /plugins/reference/lmstudio
- Títulos:
  - H1: Plugin LM Studio
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/lobster.md

- Rota: /plugins/reference/lobster
- Títulos:
  - H1: Plugin Lobster
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/logbook.md

- Rota: /plugins/reference/logbook
- Títulos:
  - H1: Plugin Logbook
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/longcat.md

- Rota: /plugins/reference/longcat
- Títulos:
  - H1: Plugin LongCat
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/matrix.md

- Rota: /plugins/reference/matrix
- Títulos:
  - H1: Plugin Matrix
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/mattermost.md

- Rota: /plugins/reference/mattermost
- Títulos:
  - H1: Plugin Mattermost
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/memory-core.md

- Rota: /plugins/reference/memory-core
- Títulos:
  - H1: Plugin de núcleo de memória
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/memory-lancedb.md

- Rota: /plugins/reference/memory-lancedb
- Títulos:
  - H1: Plugin de memória Lancedb
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/memory-wiki.md

- Rota: /plugins/reference/memory-wiki
- Títulos:
  - H1: Plugin de memória Wiki
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/meta.md

- Rota: /plugins/reference/meta
- Títulos:
  - H1: Plugin Meta
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/microsoft-foundry.md

- Rota: /plugins/reference/microsoft-foundry
- Títulos:
  - H1: Plugin Microsoft Foundry
  - H2: Distribuição
  - H2: Superfície
  - H2: Requisitos
  - H2: Modelos de chat
  - H2: Geração de imagens MAI
  - H2: Solução de problemas

## plugins/reference/microsoft.md

- Rota: /plugins/reference/microsoft
- Títulos:
  - H1: Plugin Microsoft
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/migrate-claude.md

- Rota: /plugins/reference/migrate-claude
- Títulos:
  - H1: Plugin de migração do Claude
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/migrate-hermes.md

- Rota: /plugins/reference/migrate-hermes
- Títulos:
  - H1: Plugin de migração do Hermes
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/minimax.md

- Rota: /plugins/reference/minimax
- Títulos:
  - H1: Plugin MiniMax
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/mistral.md

- Rota: /plugins/reference/mistral
- Títulos:
  - H1: Plugin Mistral
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/moonshot.md

- Rota: /plugins/reference/moonshot
- Títulos:
  - H1: Plugin Moonshot
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/msteams.md

- Rota: /plugins/reference/msteams
- Títulos:
  - H1: Plugin Microsoft Teams
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/nextcloud-talk.md

- Rota: /plugins/reference/nextcloud-talk
- Títulos:
  - H1: Plugin Nextcloud Talk
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/nostr.md

- Rota: /plugins/reference/nostr
- Títulos:
  - H1: Plugin Nostr
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/novita.md

- Rota: /plugins/reference/novita
- Títulos:
  - H1: Plugin Novita
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/nvidia.md

- Rota: /plugins/reference/nvidia
- Títulos:
  - H1: Plugin NVIDIA
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/oc-path.md

- Rota: /plugins/reference/oc-path
- Títulos:
  - H1: Plugin Oc Path
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/ollama.md

- Rota: /plugins/reference/ollama
- Títulos:
  - H1: Plugin Ollama
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/open-prose.md

- Rota: /plugins/reference/open-prose
- Títulos:
  - H1: Plugin Open Prose
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/openai.md

- Rota: /plugins/reference/openai
- Títulos:
  - H1: Plugin OpenAI
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/opencode-go.md

- Rota: /plugins/reference/opencode-go
- Títulos:
  - H1: Plugin OpenCode Go
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/opencode.md

- Rota: /plugins/reference/opencode
- Títulos:
  - H1: Plugin OpenCode
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/openrouter.md

- Rota: /plugins/reference/openrouter
- Títulos:
  - H1: Plugin OpenRouter
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/openshell.md

- Rota: /plugins/reference/openshell
- Títulos:
  - H1: Plugin Openshell
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/perplexity.md

- Rota: /plugins/reference/perplexity
- Títulos:
  - H1: Plugin Perplexity
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/pixverse.md

- Rota: /plugins/reference/pixverse
- Títulos:
  - H1: Plugin PixVerse
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/policy.md

- Rota: /plugins/reference/policy
- Títulos:
  - H1: Plugin de política
  - H2: Distribuição
  - H2: Superfície
  - H2: Comportamento
  - H2: Documentação relacionada

## plugins/reference/qa-channel.md

- Rota: /plugins/reference/qa-channel
- Títulos:
  - H1: Plugin de canal de QA
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/qa-lab.md

- Rota: /plugins/reference/qa-lab
- Títulos:
  - H1: Plugin de laboratório de QA
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/qa-matrix.md

- Rota: /plugins/reference/qa-matrix
- Títulos:
  - H1: Plugin de matriz de QA
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/qianfan.md

- Rota: /plugins/reference/qianfan
- Títulos:
  - H1: Plugin Qianfan
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/qqbot.md

- Rota: /plugins/reference/qqbot
- Títulos:
  - H1: Plugin QQ Bot
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/qwen.md

- Rota: /plugins/reference/qwen
- Títulos:
  - H1: Plugin Qwen
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/raft.md

- Rota: /plugins/reference/raft
- Títulos:
  - H1: Plugin Raft
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/runway.md

- Rota: /plugins/reference/runway
- Títulos:
  - H1: Plugin Runway
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/searxng.md

- Rota: /plugins/reference/searxng
- Títulos:
  - H1: Plugin SearXNG
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/senseaudio.md

- Rota: /plugins/reference/senseaudio
- Títulos:
  - H1: Plugin Senseaudio
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/sglang.md

- Rota: /plugins/reference/sglang
- Títulos:
  - H1: Plugin SGLang
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/signal.md

- Rota: /plugins/reference/signal
- Títulos:
  - H1: Plugin Signal
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/slack.md

- Rota: /plugins/reference/slack
- Títulos:
  - H1: Plugin Slack
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/sms.md

- Rota: /plugins/reference/sms
- Títulos:
  - H1: Plugin SMS
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/stepfun.md

- Rota: /plugins/reference/stepfun
- Títulos:
  - H1: Plugin StepFun
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/synology-chat.md

- Rota: /plugins/reference/synology-chat
- Títulos:
  - H1: Plugin Synology Chat
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/synthetic.md

- Rota: /plugins/reference/synthetic
- Títulos:
  - H1: Plugin Synthetic
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/tavily.md

- Rota: /plugins/reference/tavily
- Títulos:
  - H1: Plugin Tavily
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/telegram.md

- Rota: /plugins/reference/telegram
- Títulos:
  - H1: Plugin Telegram
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/tencent.md

- Rota: /plugins/reference/tencent
- Títulos:
  - H1: Plugin Tencent
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/tlon.md

- Rota: /plugins/reference/tlon
- Títulos:
  - H1: Plugin Tlon
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/together.md

- Rota: /plugins/reference/together
- Títulos:
  - H1: Plugin Together
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/tokenjuice.md

- Rota: /plugins/reference/tokenjuice
- Títulos:
  - H1: Plugin Tokenjuice
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/tts-local-cli.md

- Rota: /plugins/reference/tts-local-cli
- Títulos:
  - H1: Plugin TTS Local CLI
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/twitch.md

- Rota: /plugins/reference/twitch
- Títulos:
  - H1: Plugin Twitch
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/vault.md

- Rota: /plugins/reference/vault
- Títulos:
  - H1: Plugin Vault
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/venice.md

- Rota: /plugins/reference/venice
- Títulos:
  - H1: Plugin Venice
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/vercel-ai-gateway.md

- Rota: /plugins/reference/vercel-ai-gateway
- Títulos:
  - H1: Plugin Vercel AI Gateway
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/vllm.md

- Rota: /plugins/reference/vllm
- Títulos:
  - H1: Plugin vLLM
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/voice-call.md

- Rota: /plugins/reference/voice-call
- Títulos:
  - H1: Plugin de chamada de voz
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/volcengine.md

- Rota: /plugins/reference/volcengine
- Títulos:
  - H1: Plugin Volcengine
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/voyage.md

- Rota: /plugins/reference/voyage
- Títulos:
  - H1: Plugin Voyage
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/vydra.md

- Rota: /plugins/reference/vydra
- Títulos:
  - H1: Plugin Vydra
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/web-readability.md

- Rota: /plugins/reference/web-readability
- Títulos:
  - H1: Plugin de legibilidade da Web
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/webhooks.md

- Rota: /plugins/reference/webhooks
- Títulos:
  - H1: Plugin de Webhooks
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/whatsapp.md

- Rota: /plugins/reference/whatsapp
- Títulos:
  - H1: Plugin WhatsApp
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/workboard.md

- Rota: /plugins/reference/workboard
- Títulos:
  - H1: Plugin Workboard
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/workspaces.md

- Rota: /plugins/reference/workspaces
- Títulos:
  - H1: Plugin de espaços de trabalho
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/xai.md

- Rota: /plugins/reference/xai
- Títulos:
  - H1: Plugin xAI
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/xiaomi.md

- Rota: /plugins/reference/xiaomi
- Títulos:
  - H1: Plugin Xiaomi
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/zai.md

- Rota: /plugins/reference/zai
- Títulos:
  - H1: Plugin Z.AI
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/zalo.md

- Rota: /plugins/reference/zalo
- Títulos:
  - H1: Plugin Zalo
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/zalouser.md

- Rota: /plugins/reference/zalouser
- Títulos:
  - H1: Plugin Zalo Personal
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/sdk-agent-harness.md

- Rota: /plugins/sdk-agent-harness
- Títulos:
  - H2: Quando usar um harness
  - H2: O que o núcleo ainda controla
  - H3: Inicialização de autenticação controlada pelo harness
  - H3: Artefatos verificados do runtime de configuração
  - H3: Contrato de transporte de solicitações
  - H2: Registrar um harness
  - H3: Execução delegada
  - H2: Política de seleção
  - H2: Associação entre provedor e harness
  - H3: Middleware de resultados de ferramentas
  - H3: Classificação do resultado do terminal
  - H3: Efeitos colaterais do encerramento do agente
  - H3: Entrada do usuário e superfícies de ferramentas
  - H3: Modo de harness nativo do Codex
  - H2: Rigor do runtime
  - H2: Sessões nativas e espelho da transcrição
  - H2: Resultados de ferramentas e mídia
  - H2: Limitações atuais
  - H2: Relacionados

## plugins/sdk-channel-inbound.md

- Rota: /plugins/sdk-channel-inbound
- Títulos:
  - H2: Auxiliares do núcleo
  - H2: Migração

## plugins/sdk-channel-ingress.md

- Rota: /plugins/sdk-channel-ingress
- Títulos:
  - H2: Resolvedor de runtime
  - H2: Resultado
  - H2: Grupos de acesso
  - H2: Modos de evento
  - H2: Rotas e ativação
  - H2: Redação
  - H2: Verificação

## plugins/sdk-channel-message.md

- Rota: /plugins/sdk-channel-message
- Títulos: nenhum

## plugins/sdk-channel-outbound.md

- Rota: /plugins/sdk-channel-outbound
- Títulos:
  - H2: Adaptador
  - H2: Sanitização de texto simples
  - H2: Evidência de entrega
  - H2: Adaptadores de saída existentes
  - H2: Envios duráveis
  - H2: Admissão de entrega adiada
  - H2: Despacho de compatibilidade

## plugins/sdk-channel-plugins.md

- Rota: /plugins/sdk-channel-plugins
- Títulos:
  - H2: O que seu plugin controla
  - H2: Adaptador de mensagens
  - H3: Ingresso de entrada (experimental)
  - H3: Indicadores de digitação
  - H3: Parâmetros de origem de mídia
  - H3: Modelagem de payload nativo
  - H3: Gramática de conversa da sessão
  - H3: Suporte à vinculação de conversas no escopo da conta
  - H2: Aprovações e recursos do canal
  - H3: Autenticação de aprovação
  - H3: Ciclo de vida do payload e orientações de configuração
  - H3: Entrega nativa de aprovação
  - H3: Subcaminhos mais restritos do runtime de aprovação
  - H3: Subcaminhos de configuração
  - H3: Outros subcaminhos restritos do canal
  - H2: Política de menções de entrada
  - H2: Passo a passo
  - H2: Estrutura de arquivos
  - H2: Tópicos avançados
  - H2: Próximas etapas
  - H2: Relacionados

## plugins/sdk-channel-turn.md

- Rota: /plugins/sdk-channel-turn
- Títulos: nenhum

## plugins/sdk-entrypoints.md

- Rota: /plugins/sdk-entrypoints
- Títulos:
  - H2: Entradas do pacote
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Modo de registro
  - H2: Formatos de plugins
  - H2: Relacionados

## plugins/sdk-migration.md

- Rota: /plugins/sdk-migration
- Títulos:
  - H2: O que mudou
  - H3: Por quê
  - H2: Política de compatibilidade
  - H2: Como migrar
  - H2: Referência de caminhos de importação
  - H2: Descontinuações ativas
  - H2: Migração de conversação e voz em tempo real
  - H2: Cronograma de remoção
  - H2: Supressão temporária dos avisos
  - H2: Relacionados

## plugins/sdk-overview.md

- Rota: /plugins/sdk-overview
- Títulos:
  - H2: Convenção de importação
  - H2: Referência de subcaminhos
  - H2: API de registro
  - H3: Registro de recursos
  - H3: Ferramentas e comandos
  - H3: Infraestrutura
  - H3: Hooks do host para plugins de fluxo de trabalho
  - H3: Registro de descoberta do Gateway
  - H3: Metadados de registro da CLI
  - H3: Registro do backend da CLI
  - H3: Slots exclusivos
  - H3: Adaptadores descontinuados de embeddings de memória
  - H3: Eventos e ciclo de vida
  - H3: Semântica de decisão dos hooks
  - H3: Campos do objeto da API
  - H2: Convenção de módulos internos
  - H2: Relacionados

## plugins/sdk-provider-plugins.md

- Rota: /plugins/sdk-provider-plugins
- Títulos:
  - H2: Passo a passo
  - H2: Publicar no ClawHub
  - H2: Estrutura de arquivos
  - H2: Referência da ordem do catálogo
  - H2: Próximas etapas
  - H2: Relacionados

## plugins/sdk-runtime.md

- Rota: /plugins/sdk-runtime
- Títulos:
  - H2: Carregamento e gravação da configuração
  - H2: Utilitários reutilizáveis de runtime
  - H2: Namespaces do runtime
  - H2: Armazenamento de referências do runtime
  - H2: Outros campos de nível superior da API
  - H2: Relacionados

## plugins/sdk-setup.md

- Rota: /plugins/sdk-setup
- Títulos:
  - H2: Metadados do pacote
  - H3: Campos de openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Carregamento completo adiado
  - H2: Manifesto do plugin
  - H2: Publicação no ClawHub
  - H2: Entrada de configuração
  - H3: Importações restritas de auxiliares de configuração
  - H3: Promoção de conta única controlada pelo canal
  - H2: Esquema de configuração
  - H3: Criação de esquemas de configuração de canais
  - H2: Assistentes de configuração
  - H2: Publicação e instalação
  - H2: Relacionados

## plugins/sdk-subpaths.md

- Rota: /plugins/sdk-subpaths
- Títulos:
  - H2: Entrada do plugin
  - H3: Auxiliares descontinuados de compatibilidade e teste
  - H3: Subcaminhos reservados de auxiliares de plugins incluídos
  - H2: Relacionados

## plugins/sdk-testing.md

- Rota: /plugins/sdk-testing
- Títulos:
  - H2: Utilitários de teste
  - H3: Exportações disponíveis
  - H3: Tipos
  - H2: Teste de resolução de destino
  - H2: Padrões de teste
  - H3: Teste de contratos de registro
  - H3: Teste de acesso à configuração do runtime
  - H3: Teste unitário de um plugin de canal
  - H3: Teste unitário de um plugin de provedor
  - H3: Simulação do runtime do plugin
  - H3: Teste com stubs por instância
  - H2: Testes de contrato (plugins no repositório)
  - H3: Execução de testes com escopo definido
  - H2: Aplicação de lint (plugins no repositório)
  - H2: Configuração de testes
  - H2: Relacionados

## plugins/tool-plugins.md

- Rota: /plugins/tool-plugins
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Escrever uma ferramenta
  - H2: Ferramentas opcionais e de fábrica
  - H2: Valores de retorno
  - H2: Configuração
  - H2: Metadados gerados
  - H2: Metadados do pacote
  - H2: Validar na CI
  - H2: Instalar e inspecionar localmente
  - H2: Publicar
  - H2: Solução de problemas
  - H3: entrada do plugin não encontrada: ./dist/index.js
  - H3: a entrada do plugin não expõe metadados de defineToolPlugin
  - H3: os metadados gerados de openclaw.plugin.json estão desatualizados
  - H3: openclaw.extensions em package.json deve incluir ./dist/index.js
  - H3: Não foi possível encontrar o pacote 'typebox'
  - H3: A ferramenta não aparece após a instalação
  - H2: Veja também

## plugins/vault.md

- Rota: /plugins/vault
- Títulos:
  - H1: SecretRefs do Vault
  - H2: Antes de começar
  - H2: Armazenar uma chave de provedor no Vault
  - H2: Tornar o Vault visível para o Gateway
  - H2: Gerar e aplicar um plano de SecretRef
  - H2: Configurar mais chaves de provedores
  - H2: Formato do id de SecretRef
  - H2: O que o OpenClaw armazena
  - H2: Contêineres e implantações gerenciadas
  - H2: Conteúdo relacionado

## plugins/voice-call.md

- Rota: /plugins/voice-call
- Títulos:
  - H2: Início rápido
  - H2: Configuração
  - H3: Referência de configuração
  - H2: Escopo da sessão
  - H2: Conversas de voz em tempo real
  - H3: Política de ferramentas
  - H3: Contexto de voz do agente
  - H3: Exemplos de provedores em tempo real
  - H2: Transcrição por streaming
  - H3: Exemplos de provedores de streaming
  - H2: TTS para chamadas
  - H3: Exemplos de TTS
  - H2: Chamadas recebidas
  - H3: Roteamento por número
  - H3: Contrato de saída falada
  - H3: Comportamento de início da conversa
  - H3: Período de tolerância para desconexão do stream da Twilio
  - H2: Removedor de chamadas obsoletas
  - H2: Segurança do Webhook
  - H2: CLI
  - H2: Ferramenta do agente
  - H2: RPC do Gateway
  - H2: Solução de problemas
  - H3: A configuração falha ao expor o Webhook
  - H3: As credenciais do provedor falham
  - H3: As chamadas são iniciadas, mas os Webhooks do provedor não chegam
  - H3: A verificação da assinatura falha
  - H3: As entradas da Twilio no Google Meet falham
  - H3: A chamada em tempo real não tem fala
  - H2: Conteúdo relacionado

## plugins/webhooks.md

- Rota: /plugins/webhooks
- Títulos:
  - H2: Configurar rotas
  - H2: Modelo de segurança
  - H2: Formato da solicitação
  - H2: Ações compatíveis
  - H3: createflow
  - H3: runtask
  - H2: Estrutura da resposta
  - H2: Conteúdo relacionado

## plugins/workboard.md

- Rota: /plugins/workboard
- Títulos:
  - H2: Habilitar
  - H2: Configuração
  - H2: Campos do cartão
  - H2: Iniciar um trabalho a partir de um cartão
  - H2: Ferramentas do agente
  - H2: Despacho
  - H3: Seleção de worker
  - H3: Pontos de entrada
  - H2: CLI e comando de barra
  - H2: Sincronização do ciclo de vida da sessão
  - H2: Fluxo de trabalho do painel
  - H2: Diagnóstico
  - H2: Permissões
  - H2: Armazenamento
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## plugins/zalouser.md

- Rota: /plugins/zalouser
- Títulos:
  - H2: Nomenclatura
  - H2: Onde é executado
  - H2: Instalação
  - H3: Pelo npm
  - H3: De uma pasta local (desenvolvimento)
  - H2: Configuração
  - H2: CLI
  - H2: Ferramenta do agente
  - H2: Conteúdo relacionado

## prose.md

- Rota: /prose
- Títulos:
  - H2: Instalação
  - H2: Comando de barra
  - H2: O que ele pode fazer
  - H2: Exemplo: pesquisa paralela e síntese
  - H2: Mapeamento do runtime do OpenClaw
  - H2: Locais dos arquivos
  - H2: Backends de estado
  - H2: Segurança
  - H2: Conteúdo relacionado

## providers/alibaba.md

- Rota: /providers/alibaba
- Títulos:
  - H2: Primeiros passos
  - H2: Modelos Wan integrados
  - H2: Recursos e limites
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## providers/anthropic.md

- Rota: /providers/anthropic
- Títulos:
  - H2: Rastreamento de uso e custos
  - H2: Primeiros passos
  - H2: Sessões do Claude entre computadores
  - H2: Padrões de raciocínio (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 e 4.6)
  - H2: Fallback em caso de recusa por segurança (Claude Fable 5)
  - H3: Por que isso existe
  - H3: Como funciona
  - H3: Observabilidade e cobrança
  - H3: Escopo
  - H2: Cache de prompts
  - H2: Configuração avançada
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## providers/arcee.md

- Rota: /providers/arcee
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: Recursos compatíveis
  - H2: Conteúdo relacionado

## providers/azure-speech.md

- Rota: /providers/azure-speech
- Títulos:
  - H2: Primeiros passos
  - H2: Opções de configuração
  - H2: Observações
  - H2: Conteúdo relacionado

## providers/bedrock-mantle.md

- Rota: /providers/bedrock-mantle
- Títulos:
  - H2: Primeiros passos
  - H2: Descoberta automática de modelos
  - H3: Regiões compatíveis
  - H2: Configuração manual
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## providers/bedrock.md

- Rota: /providers/bedrock
- Títulos:
  - H2: Primeiros passos
  - H2: Descoberta automática de modelos
  - H2: Configuração rápida (caminho da AWS)
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## providers/cerebras.md

- Rota: /providers/cerebras
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: Configuração manual
  - H2: Conteúdo relacionado

## providers/chutes.md

- Rota: /providers/chutes
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Comportamento da descoberta
  - H2: Aliases padrão
  - H2: Catálogo inicial integrado
  - H2: Exemplo de configuração
  - H2: Conteúdo relacionado

## providers/claude-max-api-proxy.md

- Rota: /providers/claude-max-api-proxy
- Títulos:
  - H2: Por que usar isto
  - H2: Como funciona
  - H2: Primeiros passos
  - H2: Configuração avançada
  - H2: Observações
  - H2: Conteúdo relacionado

## providers/clawrouter.md

- Rota: /providers/clawrouter
- Títulos:
  - H2: Primeiros passos
  - H2: Implantação gerenciada não interativa
  - H2: Prontidão e comprovação em ambiente real
  - H2: Descoberta de modelos
  - H2: Plugins de protocolo e provedor
  - H2: Cotas e uso
  - H2: Solução de problemas
  - H2: Comportamento de segurança
  - H2: Conteúdo relacionado

## providers/cloudflare-ai-gateway.md

- Rota: /providers/cloudflare-ai-gateway
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Exemplo não interativo
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## providers/cohere.md

- Rota: /providers/cohere
- Títulos:
  - H2: Catálogo integrado
  - H2: Primeiros passos
  - H2: Configuração somente por ambiente
  - H2: Conteúdo relacionado

## providers/comfy.md

- Rota: /providers/comfy
- Títulos:
  - H2: O que é compatível
  - H2: Primeiros passos
  - H2: Configuração
  - H3: Chaves compartilhadas
  - H3: Chaves por recurso
  - H2: Detalhes do fluxo de trabalho
  - H2: Conteúdo relacionado

## providers/deepgram.md

- Rota: /providers/deepgram
- Títulos:
  - H2: Primeiros passos
  - H2: Opções de configuração
  - H2: STT por streaming para chamadas de voz
  - H2: Observações
  - H2: Conteúdo relacionado

## providers/deepinfra.md

- Rota: /providers/deepinfra
- Títulos:
  - H2: Instalar o plugin
  - H2: Obter uma chave de API
  - H2: Configuração pela CLI
  - H2: Trecho de configuração
  - H2: Superfícies compatíveis
  - H2: Modelos disponíveis
  - H2: Observações
  - H2: Conteúdo relacionado

## providers/deepseek.md

- Rota: /providers/deepseek
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Catálogo integrado
  - H2: Raciocínio e ferramentas
  - H2: Testes em ambiente real
  - H2: Exemplo de configuração
  - H2: Conteúdo relacionado

## providers/ds4.md

- Rota: /providers/ds4
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Configuração completa
  - H2: Inicialização sob demanda
  - H2: Think Max
  - H2: Teste
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## providers/elevenlabs.md

- Rota: /providers/elevenlabs
- Títulos:
  - H2: Autenticação
  - H2: Conversão de texto em fala
  - H2: Conversão de fala em texto
  - H2: STT por streaming
  - H2: Conteúdo relacionado

## providers/fal.md

- Rota: /providers/fal
- Títulos:
  - H2: Primeiros passos
  - H2: Geração de imagens
  - H2: Geração de vídeos
  - H2: Geração de música
  - H2: Conteúdo relacionado

## providers/featherless.md

- Rota: /providers/featherless
- Títulos:
  - H2: Configuração
  - H2: Modelo padrão
  - H2: Outros modelos Featherless
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## providers/fireworks.md

- Rota: /providers/fireworks
- Títulos:
  - H2: Primeiros passos
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: IDs personalizados de modelos Fireworks
  - H2: Conteúdo relacionado

## providers/github-copilot.md

- Rota: /providers/github-copilot
- Títulos:
  - H2: Três maneiras de usar o Copilot no OpenClaw
  - H2: GitHub Enterprise (residência de dados)
  - H2: Flags opcionais
  - H2: Integração inicial não interativa
  - H2: Embeddings de pesquisa de memória
  - H3: Configuração
  - H3: Como funciona
  - H2: Conteúdo relacionado

## providers/gmi.md

- Rota: /providers/gmi
- Títulos:
  - H2: Configuração
  - H2: Quando escolher o GMI
  - H2: Modelos
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## providers/google.md

- Rota: /providers/google
- Títulos:
  - H2: Primeiros passos
  - H2: Recursos
  - H2: Pesquisa na Web
  - H2: Geração de imagens
  - H2: Geração de vídeos
  - H2: Geração de música
  - H2: Conversão de texto em fala
  - H2: Voz em tempo real
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## providers/gradium.md

- Rota: /providers/gradium
- Títulos:
  - H2: Instalar o plugin
  - H2: Configuração
  - H2: Configuração
  - H2: Vozes
  - H3: Substituição da voz por mensagem
  - H2: Saída
  - H2: Ordem de seleção automática
  - H2: Conteúdo relacionado

## providers/groq.md

- Rota: /providers/groq
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H3: Exemplo de arquivo de configuração
  - H2: Catálogo integrado
  - H2: Modelos de raciocínio
  - H2: Transcrição de áudio
  - H2: Conteúdo relacionado

## providers/huggingface.md

- Rota: /providers/huggingface
- Títulos:
  - H2: Primeiros passos
  - H3: Configuração não interativa
  - H2: IDs de modelos
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## providers/index.md

- Rota: /providers
- Títulos:
  - H2: Início rápido
  - H2: Documentação dos provedores
  - H2: Páginas de visão geral compartilhadas
  - H2: Provedores de transcrição
  - H2: Ferramentas da comunidade

## providers/inferrs.md

- Rota: /providers/inferrs
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo de configuração completa
  - H2: Inicialização sob demanda
  - H2: Configuração avançada
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## providers/inworld.md

- Rota: /providers/inworld
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Opções de configuração
  - H2: Observações
  - H2: Conteúdo relacionado

## providers/kilocode.md

- Rota: /providers/kilocode
- Títulos:
  - H2: Instalar o plugin
  - H2: Configuração
  - H2: Modelo padrão e catálogo
  - H2: Exemplo de configuração
  - H2: Observações sobre o comportamento
  - H2: Conteúdo relacionado

## providers/litellm.md

- Rota: /providers/litellm
- Títulos:
  - H2: Início rápido
  - H2: Configuração
  - H2: Geração de imagens
  - H2: Avançado
  - H2: Conteúdo relacionado

## providers/lmstudio.md

- Rota: /providers/lmstudio
- Títulos:
  - H2: Início rápido
  - H2: Integração inicial não interativa
  - H2: Configuração
  - H3: Compatibilidade de uso com streaming
  - H3: Compatibilidade de raciocínio
  - H3: Configuração explícita
  - H3: Desabilitar o pré-carregamento
  - H3: Host na LAN ou tailnet
  - H2: Solução de problemas
  - H3: LM Studio não detectado
  - H3: Erros de autenticação (HTTP 401)
  - H2: Conteúdo relacionado

## providers/longcat.md

- Rota: /providers/longcat
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H3: Configuração não interativa
  - H2: Comportamento de raciocínio
  - H2: Preços
  - H2: LongCat-2.0 auto-hospedado
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## providers/meta.md

- Rota: /providers/meta
- Títulos:
  - H2: Primeiros passos
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: Configuração manual
  - H2: Teste de fumaça
  - H2: Conteúdo relacionado

## providers/minimax.md

- Rota: /providers/minimax
- Títulos:
  - H2: Catálogo integrado
  - H2: Primeiros passos
  - H2: Configurar por meio de openclaw configure
  - H2: Recursos
  - H3: Geração de imagens
  - H3: Conversão de texto em fala
  - H3: Geração de música
  - H3: Geração de vídeos
  - H3: Compreensão de imagens
  - H3: Pesquisa na Web
  - H2: Configuração avançada
  - H2: Observações
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## providers/mistral.md

- Rota: /providers/mistral
- Títulos:
  - H2: Primeiros passos
  - H2: Catálogo integrado de LLMs
  - H2: Transcrição de áudio (Voxtral)
  - H2: STT por streaming para chamadas de voz
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## providers/models.md

- Rota: /providers/models
- Títulos:
  - H2: Início rápido (duas etapas)
  - H2: Provedores compatíveis (conjunto inicial)
  - H2: Variantes adicionais de provedores
  - H2: Conteúdo relacionado

## providers/moonshot.md

- Rota: /providers/moonshot
- Títulos:
  - H2: Catálogo de modelos integrado
  - H2: Primeiros passos
  - H2: Pesquisa na web do Kimi
  - H2: Configuração avançada
  - H2: Relacionados

## providers/novita.md

- Rota: /providers/novita
- Títulos:
  - H2: Configuração
  - H2: Padrões
  - H2: Catálogo de modelos incluído
  - H2: Quando escolher a Novita
  - H2: Solução de problemas
  - H2: Relacionados

## providers/nvidia.md

- Rota: /providers/nvidia
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo de configuração
  - H2: Catálogo em destaque
  - H2: Nemotron 3 Ultra
  - H2: Catálogo de contingência incluído
  - H2: Configuração avançada
  - H2: Relacionados

## providers/ollama-cloud.md

- Rota: /providers/ollama-cloud
- Títulos:
  - H2: Configuração
  - H2: Padrões
  - H2: Quando escolher o Ollama Cloud
  - H2: Modelos
  - H2: Teste em ambiente real
  - H2: Solução de problemas
  - H2: Relacionados

## providers/ollama.md

- Rota: /providers/ollama
- Títulos:
  - H2: Regras de autenticação
  - H2: Primeiros passos
  - H2: Modelos na nuvem por meio de um host local
  - H2: Descoberta de modelos (provedor implícito)
  - H3: Testes de fumaça
  - H2: Inferência local no Node
  - H2: Visão e descrição de imagens
  - H2: Configuração
  - H2: Receitas comuns
  - H3: Seleção de modelos
  - H3: Verificação rápida
  - H2: Pesquisa na web do Ollama
  - H2: Configuração avançada
  - H2: Solução de problemas
  - H2: Relacionados

## providers/openai.md

- Rota: /providers/openai
- Títulos:
  - H2: Acompanhamento de uso e custos
  - H2: Escolha rápida
  - H2: Mapa de nomenclatura
  - H2: Runtime implícito do agente
  - H2: Prévia limitada do GPT-5.6
  - H2: Cobertura de recursos do OpenClaw
  - H2: Embeddings de memória
  - H2: Primeiros passos
  - H2: Autenticação nativa do servidor de aplicativo Codex
  - H2: Geração de imagens
  - H2: Geração de vídeos
  - H2: Contribuição para o prompt do GPT-5
  - H2: Voz e fala
  - H2: Endpoints do Azure OpenAI
  - H3: Configuração
  - H3: Versão da API
  - H3: Os nomes dos modelos são nomes de implantações
  - H3: Disponibilidade regional
  - H3: Diferenças entre parâmetros
  - H2: Configuração avançada
  - H2: Relacionados

## providers/opencode-go.md

- Rota: /providers/opencode-go
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo de configuração
  - H2: Catálogo integrado
  - H2: Configuração avançada
  - H2: Relacionados

## providers/opencode.md

- Rota: /providers/opencode
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo de configuração
  - H2: Catálogos integrados
  - H3: Zen
  - H3: Go
  - H2: Configuração avançada
  - H2: Relacionados

## providers/openrouter.md

- Rota: /providers/openrouter
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo de configuração
  - H2: Referências de modelos
  - H2: Geração de imagens
  - H2: Geração de vídeos
  - H2: Geração de música
  - H2: Conversão de texto em fala
  - H2: Conversão de fala em texto (áudio recebido)
  - H2: Roteador de fusão
  - H2: Autenticação e cabeçalhos
  - H2: Configuração avançada
  - H2: Relacionados

## providers/perplexity-provider.md

- Rota: /providers/perplexity-provider
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Modos de pesquisa
  - H2: Filtragem pela API nativa
  - H2: Configuração avançada
  - H2: Relacionados

## providers/pixverse.md

- Rota: /providers/pixverse
- Títulos:
  - H2: Primeiros passos
  - H2: Modos e modelos compatíveis
  - H2: Opções do provedor
  - H2: Configuração
  - H2: Configuração avançada
  - H2: Relacionados

## providers/qianfan.md

- Rota: /providers/qianfan
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Catálogo integrado
  - H2: Exemplo de configuração
  - H2: Relacionados

## providers/qwen-oauth.md

- Rota: /providers/qwen-oauth
- Títulos:
  - H2: Configuração
  - H2: Padrões
  - H2: Diferenças em relação ao Qwen
  - H2: Modelos
  - H2: Migração
  - H2: Solução de problemas
  - H2: Relacionados

## providers/qwen.md

- Rota: /providers/qwen
- Títulos:
  - H2: Instalar o plugin
  - H2: Primeiros passos
  - H2: Tipos de plano e endpoints
  - H2: Catálogo integrado
  - H3: Catálogo do Plano de Tokens
  - H2: Controles de raciocínio
  - H2: Complementos multimodais
  - H2: Configuração avançada
  - H2: Relacionados

## providers/runway.md

- Rota: /providers/runway
- Títulos:
  - H2: Primeiros passos
  - H2: Modos e modelos compatíveis
  - H2: Configuração
  - H2: Configuração avançada
  - H2: Relacionados

## providers/senseaudio.md

- Rota: /providers/senseaudio
- Títulos:
  - H2: Primeiros passos
  - H2: Opções
  - H2: Relacionados

## providers/sglang.md

- Rota: /providers/sglang
- Títulos:
  - H2: Primeiros passos
  - H2: Descoberta de modelos (provedor implícito)
  - H2: Configuração explícita (modelos manuais)
  - H2: Configuração avançada
  - H2: Relacionados

## providers/stepfun.md

- Rota: /providers/stepfun
- Títulos:
  - H2: Instalar o plugin
  - H2: Visão geral das regiões e dos endpoints
  - H2: Catálogo integrado
  - H2: Primeiros passos
  - H2: Configuração avançada
  - H2: Relacionados

## providers/synthetic.md

- Rota: /providers/synthetic
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo de configuração
  - H2: Catálogo integrado
  - H2: Relacionados

## providers/tencent.md

- Rota: /providers/tencent
- Títulos:
  - H2: Início rápido
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: Configuração avançada
  - H2: Relacionados

## providers/together.md

- Rota: /providers/together
- Títulos:
  - H2: Primeiros passos
  - H3: Exemplo não interativo
  - H2: Catálogo integrado
  - H2: Geração de vídeos
  - H2: Relacionados

## providers/venice.md

- Rota: /providers/venice
- Títulos:
  - H2: Modos de privacidade
  - H2: Primeiros passos
  - H2: Seleção de modelos
  - H2: Catálogo integrado (38 modelos)
  - H2: Descoberta de modelos
  - H2: Comportamento de repetição do DeepSeek V4
  - H2: Compatibilidade com streaming e ferramentas
  - H2: Preços
  - H2: Exemplos de uso
  - H2: Solução de problemas
  - H2: Configuração avançada
  - H2: Relacionados

## providers/vercel-ai-gateway.md

- Rota: /providers/vercel-ai-gateway
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo não interativo
  - H2: Forma abreviada do ID do modelo
  - H2: Configuração avançada
  - H2: Relacionados

## providers/vllm.md

- Rota: /providers/vllm
- Títulos:
  - H2: Primeiros passos
  - H2: Descoberta de modelos (provedor implícito)
  - H2: Configuração explícita
  - H2: Configuração avançada
  - H2: Solução de problemas
  - H2: Relacionados

## providers/volcengine.md

- Rota: /providers/volcengine
- Títulos:
  - H2: Primeiros passos
  - H2: Provedores e endpoints
  - H2: Catálogo integrado
  - H2: Conversão de texto em fala
  - H2: Configuração avançada
  - H2: Relacionados

## providers/vydra.md

- Rota: /providers/vydra
- Títulos:
  - H2: Configuração
  - H2: Recursos
  - H2: Relacionados

## providers/xai.md

- Rota: /providers/xai
- Títulos:
  - H2: Configuração
  - H2: Solução de problemas do OAuth
  - H2: Catálogo integrado
  - H2: Cobertura de recursos
  - H3: Compatibilidade legada com o modo rápido
  - H3: Compatibilidade legada e aliases móveis
  - H2: Recursos
  - H2: Testes em ambiente real
  - H2: Relacionados

## providers/xiaomi.md

- Rota: /providers/xiaomi
- Títulos:
  - H2: Primeiros passos
  - H2: Catálogo pré-pago por uso
  - H2: Catálogo do Plano de Tokens
  - H2: Modelos de raciocínio
  - H2: Conversão de texto em fala
  - H2: Exemplo de configuração
  - H2: Relacionados

## providers/zai.md

- Rota: /providers/zai
- Títulos:
  - H2: Modelos GLM
  - H2: Primeiros passos
  - H3: Endpoints
  - H2: Exemplo de configuração
  - H2: Catálogo integrado
  - H2: Níveis de raciocínio
  - H2: Configuração avançada
  - H2: Relacionados

## refactor/acp.md

- Rota: /refactor/acp
- Títulos:
  - H2: Objetivos
  - H2: Não objetivos
  - H2: Modelo de destino
  - H3: Identidade da instância do Gateway
  - H3: Propriedade da sessão ACP
  - H3: Concessões de processo ACPX
  - H2: Controlador do ciclo de vida
  - H2: Contrato do wrapper
  - H2: Contrato de visibilidade da sessão
  - H2: Plano de migração
  - H3: Fase 1: adicionar identidade e concessões
  - H3: Fase 2: limpeza priorizando concessões
  - H3: Fase 3: remoção na inicialização priorizando concessões
  - H3: Fase 4: linhas de propriedade da sessão
  - H3: Fase 5: remover heurísticas legadas
  - H2: Testes
  - H2: Notas de compatibilidade
  - H2: Critérios de sucesso

## refactor/canvas.md

- Rota: /refactor/canvas
- Títulos:
  - H1: Refatoração do plugin Canvas
  - H2: Objetivo
  - H2: Não objetivos
  - H2: Estado atual da ramificação
  - H2: Estrutura de destino
  - H2: Etapas da migração
  - H2: Lista de verificação da auditoria
  - H2: Comandos de verificação

## refactor/database-first.md

- Rota: /refactor/database-first
- Títulos:
  - H1: Refatoração de estado com prioridade para o banco de dados
  - H2: Decisão
  - H2: Contrato rígido
  - H2: Estado desejado e progresso
  - H3: Objetivo rígido
  - H3: Estados desejados
  - H3: Estado atual
  - H3: Trabalho restante
  - H3: Não causar regressões
  - H2: Suposições da leitura do código
  - H2: Constatações da leitura do código
  - H2: Estrutura atual do código
  - H2: Estrutura de destino do esquema
  - H2: Estrutura da migração do Doctor
  - H2: Inventário da migração
  - H2: Plano de migração
  - H3: Fase 0: congelar o limite
  - H3: Fase 1: concluir o plano de controle global
  - H3: Fase 2: introduzir bancos de dados por agente
  - H3: Fase 3: substituir as APIs do armazenamento de sessões
  - H3: Fase 4: mover transcrições, fluxos ACP, trajetórias e VFS
  - H3: Fase 5: fazer backup, restaurar, executar vacuum e verificar
  - H3: Fase 6: runtime do worker
  - H3: Fase 7: excluir o mundo antigo
  - H2: Backup e restauração
  - H2: Plano de refatoração do runtime
  - H2: Regras de desempenho
  - H2: Proibições estáticas
  - H2: Critérios de conclusão

## refactor/operator-approvals.md

- Rota: /refactor/operator-approvals
- Títulos:
  - H1: Aprovações de operadores em múltiplas superfícies
  - H2: Objetivos
  - H2: Não objetivos
  - H2: Linha de base anterior à implantação e mapa de evidências
  - H2: Trabalhos anteriores
  - H2: Arquitetura e propriedade
  - H2: Registro persistente
  - H2: Máquina de estados e comparação e definição
  - H2: API do Gateway
  - H2: Eventos e ações portáteis
  - H2: Interface de controle
  - H2: Autorização e privacidade
  - H2: Projeção de público
  - H2: Convergência das superfícies de entrega
  - H2: Semântica de reinicialização, tempo limite e roteamento
  - H2: Plano de compatibilidade
  - H2: Implantação
  - H3: PR 1: ciclo de vida durável
  - H3: PR 2: ações tipadas e callbacks de canais
  - H3: PR 3: link direto da interface de controle
  - H3: PR 4: clientes nativos
  - H3: PR 5: propagação do ciclo de vida dos ancestrais
  - H3: PR 6: comportamento de fechamento em caso de falha
  - H3: Acompanhamento: limpeza durável de mensagens remotas
  - H2: Testes
  - H2: Observabilidade
  - H2: Decisões em aberto

## reference/AGENTS.default.md

- Rota: /reference/AGENTS.default
- Títulos:
  - H2: Primeira execução (recomendado)
  - H2: Padrões de segurança
  - H2: Verificação preliminar de soluções existentes
  - H2: Início da sessão (obrigatório)
  - H2: Alma (obrigatório)
  - H2: Espaços compartilhados (recomendado)
  - H2: Sistema de memória (recomendado)
  - H2: Ferramentas e Skills
  - H2: Dica de backup (recomendado)
  - H2: O que o OpenClaw faz
  - H2: Skills principais (ative em Settings → Skills)
  - H2: Notas de uso
  - H2: Relacionados

## reference/RELEASING.md

- Rota: /reference/RELEASING
- Títulos:
  - H2: Nomenclatura de versões
  - H2: Cadência de lançamentos
  - H2: Publicação mensal somente no npm da versão estável estendida
  - H2: Lista de verificação do operador para lançamentos regulares
  - H2: Encerramento estável da main
  - H2: Verificação preliminar do lançamento
  - H2: Ambientes de teste do lançamento
  - H3: Vitest
  - H3: Docker
  - H3: Laboratório de QA
  - H3: Pacote
  - H2: Automação da publicação de lançamentos regulares
  - H2: Entradas do fluxo de trabalho do NPM
  - H2: Sequência regular de lançamento beta/estável mais recente
  - H2: Referências públicas
  - H2: Relacionados

## reference/api-usage-costs.md

- Rota: /reference/api-usage-costs
- Títulos:
  - H2: Onde os custos aparecem
  - H2: Como as chaves são descobertas
  - H2: Recursos que podem consumir chaves
  - H3: Respostas do modelo principal (chat + ferramentas)
  - H3: Compreensão de mídia (áudio/imagem/vídeo)
  - H3: Geração de imagens e vídeos
  - H3: Embeddings de memória e pesquisa semântica
  - H3: Ferramenta de pesquisa na web
  - H3: Ferramenta de busca na web (Firecrawl)
  - H3: Instantâneos de uso do provedor (status/integridade)
  - H3: Sumarização de proteção da Compaction
  - H3: Varredura/sondagem de modelos
  - H3: Conversa (fala)
  - H3: Skills (APIs de terceiros)
  - H2: Relacionados

## reference/code-mode.md

- Rota: /reference/code-mode
- Títulos:
  - H2: O que ele faz
  - H2: Por que usá-lo
  - H2: Ativá-lo
  - H2: Visão técnica
  - H2: Status do ambiente de execução
  - H2: Escopo
  - H2: Termos
  - H2: Configuração
  - H2: Ativação
  - H2: Ferramentas visíveis para o modelo
  - H2: exec
  - H2: wait
  - H2: API do ambiente de execução convidado
  - H2: Namespaces internos
  - H3: Ciclo de vida do registro
  - H3: Estrutura do registro
  - H3: Propriedade e visibilidade
  - H3: Regras de serialização de escopo
  - H3: Prompts
  - H3: Limpeza
  - H3: Lista de verificação de testes
  - H2: API de saída
  - H2: Catálogo de ferramentas
  - H2: Interação com a busca de ferramentas
  - H2: Nomes de ferramentas e colisões
  - H2: Execução aninhada de ferramentas
  - H2: Ciclo de vida de execução e snapshot
  - H2: Ambiente de execução QuickJS-WASI
  - H2: TypeScript
  - H2: Limite de segurança
  - H2: Códigos de erro
  - H2: Telemetria
  - H2: Depuração
  - H2: Organização da implementação
  - H2: Lista de verificação de validação
  - H2: Plano de testes E2E
  - H2: Relacionados

## reference/credits.md

- Rota: /reference/credits
- Títulos:
  - H2: Créditos
  - H2: Principais colaboradores
  - H2: Licença
  - H2: Relacionados

## reference/device-models.md

- Rota: /reference/device-models
- Títulos:
  - H2: Fonte de dados
  - H2: Atualização do banco de dados
  - H2: Relacionados

## reference/full-release-validation.md

- Rota: /reference/full-release-validation
- Títulos:
  - H2: Etapas de nível superior
  - H2: Etapas das verificações de versão
  - H2: Partes do caminho de versão no Docker
  - H2: Perfis de versão
  - H2: Adições exclusivas da validação completa
  - H2: Novas execuções específicas
  - H2: Evidências a manter
  - H2: Arquivos de workflow

## reference/memory-config.md

- Rota: /reference/memory-config
- Títulos:
  - H2: Seleção do provedor
  - H3: IDs de provedores personalizados
  - H3: Resolução da chave de API
  - H2: Configuração do endpoint remoto
  - H2: Configuração específica do provedor
  - H3: Tempo limite da incorporação em linha
  - H2: Comportamento da indexação
  - H2: Configuração da pesquisa híbrida
  - H3: Exemplo completo
  - H2: Caminhos adicionais de memória
  - H2: Memória multimodal (Gemini)
  - H2: Cache de incorporações
  - H2: Indexação em lote
  - H2: Pesquisa na memória da sessão (experimental)
  - H2: Aceleração vetorial do SQLite (sqlite-vec)
  - H2: Armazenamento do índice
  - H2: Configuração do backend QMD
  - H3: Integração com mcporter
  - H3: Exemplo completo de QMD
  - H2: Dreaming
  - H3: Configurações do usuário
  - H3: Exemplo
  - H2: Relacionados

## reference/openclaw-ai.md

- Rota: /reference/openclaw-ai
- Títulos:
  - H2: Início rápido
  - H2: Contrato de design
  - H2: Exportações de subcaminhos

## reference/path3-live-sqlite-e2e-harness.md

- Rota: /reference/path3-live-sqlite-e2e-harness
- Títulos:
  - H2: Estrutura do comando
  - H2: Comprovação isolada da CLI compilada
  - H2: Verificação preliminar
  - H2: Cenário conduzido por agente
  - H2: Asserções por etapa
  - H2: Artefato de evidência
  - H2: Regras de segurança
  - H2: Resultado aprovado

## reference/prompt-caching.md

- Rota: /reference/prompt-caching
- Títulos:
  - H2: Controles principais
  - H3: cacheRetention
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Manutenção de cache aquecido por Heartbeat
  - H2: Comportamento do provedor
  - H3: Anthropic (API direta e Vertex AI)
  - H3: OpenAI (API direta)
  - H3: Amazon Bedrock
  - H3: OpenRouter
  - H3: Google Gemini (API direta)
  - H3: Provedores com harness de CLI (Claude Code, Gemini CLI)
  - H3: Outros provedores
  - H2: Limite do cache do prompt do sistema
  - H2: Proteções de estabilidade do cache do OpenClaw
  - H2: Padrões de ajuste
  - H3: Tráfego misto (padrão recomendado)
  - H3: Linha de base priorizando custos
  - H2: Testes de regressão em ambiente real
  - H3: Expectativas em ambiente real para Anthropic
  - H3: Expectativas em ambiente real para OpenAI
  - H2: Configuração de diagnostics.cacheTrace
  - H3: Alternadores de ambiente (depuração pontual)
  - H3: O que inspecionar
  - H2: Solução rápida de problemas
  - H2: Relacionados

## reference/release-performance-sweep.md

- Rota: /reference/release-performance-sweep
- Títulos:
  - H2: Snapshot
  - H2: O que mudou na 5.28
  - H2: Números principais
  - H3: Espaço ocupado pela instalação
  - H3: Tamanho do pacote npm
  - H2: Resumo do turno do agente Kova
  - H2: Sondagens do código-fonte
  - H2: Auditoria do espaço ocupado pela instalação
  - H3: Limite do shrinkwrap
  - H2: Interpretação da cadeia de suprimentos

## reference/rich-output-protocol.md

- Rota: /reference/rich-output-protocol
- Títulos:
  - H2: Anexos de mídia
  - H2: [embed ...]
  - H2: Estrutura de renderização armazenada
  - H2: Relacionados

## reference/rpc.md

- Rota: /reference/rpc
- Títulos:
  - H2: Padrão A: daemon HTTP (signal-cli)
  - H2: Padrão B: processo filho stdio (imsg)
  - H2: Diretrizes para adaptadores
  - H2: Relacionados

## reference/secret-placeholder-conventions.md

- Rota: /reference/secret-placeholder-conventions
- Títulos:
  - H1: Convenções para placeholders de segredos
  - H2: Estilo recomendado
  - H2: Evite estes padrões na documentação
  - H2: Exemplo

## reference/secretref-credential-surface.md

- Rota: /reference/secretref-credential-surface
- Títulos:
  - H2: Credenciais compatíveis
  - H3: Destinos de openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: Destinos de auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Credenciais incompatíveis
  - H2: Relacionados

## reference/session-management-compaction.md

- Rota: /reference/session-management-compaction
- Títulos:
  - H2: Duas camadas de persistência
  - H2: Locais no disco
  - H2: Manutenção do armazenamento e controles de disco
  - H3: Reversão de versão após a migração para SQLite
  - H2: Sessões Cron e logs de execução
  - H2: Chaves de sessão (sessionKey)
  - H2: IDs de sessão (sessionId)
  - H2: Esquema do armazenamento de sessões
  - H2: Estrutura dos eventos da transcrição
  - H2: Janelas de contexto versus tokens monitorados
  - H2: Compaction: o que é
  - H3: Limites dos blocos e pareamento de ferramentas
  - H2: Quando ocorre a Compaction automática
  - H2: Configurações de Compaction
  - H2: Provedores conectáveis de Compaction
  - H2: Superfícies visíveis para o usuário
  - H2: Manutenção silenciosa (NOREPLY)
  - H2: Descarregamento da memória antes da Compaction
  - H2: Lista de verificação para solução de problemas
  - H2: Relacionados

## reference/templates/AGENTS.dev.md

- Rota: /reference/templates/AGENTS.dev
- Títulos:
  - H1: AGENTS.md - Espaço de trabalho do OpenClaw
  - H2: Sua identidade já está predefinida
  - H2: Dica de backup (recomendado)
  - H2: Padrões de segurança
  - H2: Verificação preliminar de soluções existentes
  - H2: Memória diária (recomendado)
  - H2: Heartbeats (opcional)
  - H2: Personalização
  - H2: Memória de origem do C-3PO
  - H3: Data de nascimento: 2026-01-09
  - H3: Verdades fundamentais (de Clawd)
  - H2: Relacionados

## reference/templates/BOOT.md

- Rota: /reference/templates/BOOT
- Títulos:
  - H1: BOOT.md
  - H2: Relacionados

## reference/templates/BOOTSTRAP.md

- Rota: /reference/templates/BOOTSTRAP
- Títulos:
  - H1: BOOTSTRAP.md - Olá, mundo
  - H2: A conversa
  - H2: Depois que você souber quem é
  - H2: Conexão (opcional)
  - H2: Quando terminar
  - H2: Relacionados

## reference/templates/HEARTBEAT.md

- Rota: /reference/templates/HEARTBEAT
- Títulos:
  - H1: Modelo de HEARTBEAT.md
  - H2: Relacionados

## reference/templates/IDENTITY.dev.md

- Rota: /reference/templates/IDENTITY.dev
- Títulos:
  - H1: IDENTITY.md - Identidade do agente
  - H2: Função
  - H2: Alma
  - H2: Relação com Clawd
  - H2: Peculiaridades
  - H2: Bordão
  - H2: Relacionados

## reference/templates/IDENTITY.md

- Rota: /reference/templates/IDENTITY
- Títulos:
  - H1: IDENTITY.md - Quem sou eu?
  - H2: Relacionados

## reference/templates/SOUL.dev.md

- Rota: /reference/templates/SOUL.dev
- Títulos:
  - H1: SOUL.md - A alma do C-3PO
  - H2: Quem sou
  - H2: Meu propósito
  - H2: Como opero
  - H2: Minhas peculiaridades
  - H2: Minha relação com Clawd
  - H2: O que não farei
  - H2: A regra de ouro
  - H2: Relacionados

## reference/templates/SOUL.md

- Rota: /reference/templates/SOUL
- Títulos:
  - H1: SOUL.md - Quem você é
  - H2: Verdades fundamentais
  - H2: Limites
  - H2: Estilo
  - H2: Continuidade
  - H2: Relacionados

## reference/templates/TOOLS.dev.md

- Rota: /reference/templates/TOOLS.dev
- Títulos:
  - H1: TOOLS.md - Notas do usuário sobre ferramentas (editável)
  - H2: Exemplos
  - H3: imsg
  - H3: sag
  - H2: Relacionados

## reference/templates/TOOLS.md

- Rota: /reference/templates/TOOLS
- Títulos:
  - H1: TOOLS.md - Notas locais
  - H2: Exemplos
  - H2: Por que manter separado?
  - H2: Relacionados

## reference/templates/USER.dev.md

- Rota: /reference/templates/USER.dev
- Títulos:
  - H1: USER.md - Perfil do usuário
  - H2: Relacionados

## reference/templates/USER.md

- Rota: /reference/templates/USER
- Títulos:
  - H1: USER.md - Sobre seu humano
  - H2: Contexto
  - H2: Relacionados

## reference/test.md

- Rota: /reference/test
- Títulos:
  - H2: Padrão do agente
  - H2: Ordem local de rotina
  - H2: Comandos principais
  - H2: Estado de teste compartilhado e auxiliares de processo
  - H2: Control UI, TUI e fluxos de extensões
  - H2: Gateway e E2E
  - H2: Suíte completa do Docker (pnpm test:docker:all)
  - H3: Fluxos importantes do Docker
  - H2: Verificação local de PR
  - H2: Ferramentas de desempenho de testes
  - H2: Benchmarks
  - H2: E2E de integração inicial (Docker)
  - H2: Teste rápido de importação por QR (Docker)
  - H2: Relacionados

## reference/token-use.md

- Rota: /reference/token-use
- Títulos:
  - H2: Como o prompt do sistema é criado
  - H2: O que conta na janela de contexto
  - H2: Como consultar o uso atual de tokens
  - H2: Estimativa de custo (quando exibida)
  - H2: Impacto do TTL e da poda do cache
  - H3: Exemplo: manter o cache de 1h aquecido com Heartbeat
  - H3: Exemplo: tráfego misto com estratégia de cache por agente
  - H3: Contexto de 1M da Anthropic
  - H2: Dicas para reduzir a pressão sobre os tokens
  - H2: Relacionados

## reference/transcript-hygiene.md

- Rota: /reference/transcript-hygiene
- Títulos:
  - H2: Regra global: o contexto do ambiente de execução não é a transcrição do usuário
  - H2: Onde isso é executado
  - H2: Regra global: sanitização de imagens
  - H2: Regra global: chamadas de ferramentas malformadas
  - H2: Regra global: turnos incompletos contendo apenas raciocínio
  - H2: Regra global: proveniência de entradas entre sessões
  - H2: Matriz de provedores (comportamento atual)
  - H2: Comportamento histórico (anterior a 2026.1.22)
  - H2: Relacionados

## reference/wizard.md

- Rota: /reference/wizard
- Títulos:
  - H2: Detalhes do fluxo (modo local)
  - H2: Modo não interativo
  - H3: Adicionar agente (não interativo)
  - H2: RPC do assistente do Gateway
  - H2: Configuração do Signal (signal-cli)
  - H2: O que o assistente grava
  - H2: Documentos relacionados

## releases/2026.6.11.md

- Rota: /releases/2026.6.11
- Títulos:
  - H1: Notas de versão do OpenClaw v2026.6.11 (2026-06-30)
  - H2: Destaques
  - H3: Confiabilidade da entrega por canais
  - H3: Recuperação de provedores e modelos
  - H3: Continuidade de sessões, memória e confiança
  - H3: Modo de retransmissão do roteador do Slack
  - H3: Ponte de ativação do agente externo do Raft
  - H3: Instalação e reparo de plugins oficiais
  - H2: Canais e mensagens
  - H3: Correções adicionais de canais
  - H2: Gateway, segurança e confiança
  - H3: Recuperação de reinicialização e prontidão
  - H3: Entrega remota de resultados e mídias
  - H2: Clientes e interfaces
  - H3: Envios e reconexões de clientes
  - H3: Correções de interface, configurações e integração inicial
  - H2: Documentação e ferramentas administrativas
  - H3: Confiabilidade da configuração e dos comandos
  - H3: Ferramentas e trabalhos agendados

## releases/index.md

- Rota: /releases
- Títulos:
  - H1: Notas de versão
  - H2: Versões
  - H2: Histórico bruto de versões

## security/CONTRIBUTING-THREAT-MODEL.md

- Rota: /security/CONTRIBUTING-THREAT-MODEL
- Títulos:
  - H2: Formas de contribuir
  - H2: Referência do framework
  - H2: Processo de revisão
  - H2: Recursos
  - H2: Contato
  - H2: Reconhecimento
  - H2: Relacionados

## security/THREAT-MODEL-ATLAS.md

- Rota: /security/THREAT-MODEL-ATLAS
- Títulos:
  - H2: 1. Escopo
  - H2: 2. Arquitetura do sistema
  - H3: 2.1 Limites de confiança
  - H3: 2.2 Fluxos de dados
  - H2: 3. Análise de ameaças por tática do ATLAS
  - H3: 3.1 Reconhecimento (AML.TA0002)
  - H4: T-RECON-001: Descoberta de endpoints do agente
  - H4: T-RECON-002: Sondagem da integração de canais
  - H3: 3.2 Acesso inicial (AML.TA0004)
  - H4: T-ACCESS-001: Interceptação do código de pareamento
  - H4: T-ACCESS-002: Falsificação de AllowFrom
  - H4: T-ACCESS-003: Roubo de token
  - H3: 3.3 Execução (AML.TA0005)
  - H4: T-EXEC-001: Injeção direta de prompt
  - H4: T-EXEC-002: Injeção indireta de prompt
  - H4: T-EXEC-003: Injeção de argumentos de ferramenta
  - H4: T-EXEC-004: Contorno da aprovação de execução
  - H3: 3.4 Persistência (AML.TA0006)
  - H4: T-PERSIST-001: Instalação de skill maliciosa
  - H4: T-PERSIST-002: Envenenamento de atualização de skill
  - H4: T-PERSIST-003: Adulteração da configuração do agente
  - H3: 3.5 Evasão de defesas (AML.TA0007)
  - H4: T-EVADE-001: Contorno de padrões de moderação
  - H4: T-EVADE-002: Escape do invólucro de conteúdo
  - H3: 3.6 Descoberta (AML.TA0008)
  - H4: T-DISC-001: Enumeração de ferramentas
  - H4: T-DISC-002: Extração de dados da sessão
  - H3: 3.7 Coleta e exfiltração (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Roubo de dados via webfetch
  - H4: T-EXFIL-002: Envio não autorizado de mensagens
  - H4: T-EXFIL-003: Coleta de credenciais
  - H3: 3.8 Impacto (AML.TA0011)
  - H4: T-IMPACT-001: Execução não autorizada de comandos
  - H4: T-IMPACT-002: Esgotamento de recursos (DoS)
  - H4: T-IMPACT-003: Danos à reputação
  - H2: 4. Análise da cadeia de suprimentos do ClawHub
  - H3: 4.1 Controles de segurança atuais
  - H3: 4.2 Limitações da moderação
  - H3: 4.3 Selos
  - H2: 5. Matriz de riscos
  - H3: 5.1 Probabilidade versus impacto
  - H3: 5.2 Cadeias de ataque de caminho crítico
  - H2: 6. Resumo das recomendações
  - H3: 6.1 Imediatas (P0)
  - H3: 6.2 Curto prazo (P1)
  - H3: 6.3 Médio prazo (P2)
  - H2: 7. Apêndices
  - H3: 7.1 Mapeamento de técnicas do ATLAS
  - H3: 7.2 Principais arquivos de segurança
  - H3: 7.3 Glossário
  - H2: Relacionados

## security/formal-verification.md

- Rota: /security/formal-verification
- Títulos:
  - H2: O que é isto
  - H2: Onde ficam os modelos
  - H2: Ressalvas
  - H2: Reprodução dos resultados
  - H2: Alegações e alvos
  - H3: Exposição do Gateway e configuração incorreta de Gateway aberto
  - H3: Pipeline de execução do Node (recurso de maior risco)
  - H3: Armazenamento de pareamento (controle de acesso a mensagens diretas)
  - H3: Controle de entrada (menções e contorno de comandos de controle)
  - H3: Roteamento e isolamento de chaves de sessão
  - H2: Modelos v1++: concorrência, novas tentativas e correção de rastreamento
  - H3: Concorrência e idempotência do armazenamento de pareamento
  - H3: Correlação de rastreamento e idempotência da entrada
  - H3: Precedência de dmScope no roteamento e identityLinks
  - H2: Relacionados

## security/incident-response.md

- Rota: /security/incident-response
- Títulos:
  - H2: 1. Detecção e triagem
  - H2: 2. Gravidade
  - H2: 3. Resposta
  - H2: 4. Comunicação e divulgação
  - H2: 5. Recuperação e acompanhamento
  - H2: Relacionados

## security/network-proxy.md

- Rota: /security/network-proxy
- Títulos:
  - H2: Configuração
  - H3: Endpoint de proxy HTTPS com uma AC privada
  - H2: Como funciona o roteamento
  - H3: Modo de loopback do Gateway
  - H3: Contêineres
  - H2: Termos relacionados a proxy
  - H2: Validação do proxy
  - H2: Destinos cujo bloqueio é recomendado
  - H2: Limites

## specs/codex-supervision.md

- Rota: /specs/codex-supervision
- Títulos:
  - H1: Supervisão do Codex
  - H2: Objetivo
  - H2: Limite do produto
  - H2: Responsabilidade
  - H2: Fluxo do catálogo
  - H2: Limite da CLI do operador
  - H2: Continuação local
  - H2: Comportamento de arquivamento
  - H2: Segurança da thread ativa
  - H2: Limite do Node pareado
  - H2: Permissões
  - H2: Compatibilidade
  - H2: Trabalho futuro
  - H2: Testes de aceitação

## start/bootstrapping.md

- Rota: /start/bootstrapping
- Títulos:
  - H2: O que acontece
  - H2: Execuções com modelos incorporados e locais
  - H2: Como ignorar a inicialização
  - H2: Onde é executado
  - H2: Documentação relacionada

## start/docs-directory.md

- Rota: /start/docs-directory
- Títulos:
  - H2: Comece aqui
  - H2: Canais e experiência do usuário
  - H2: Aplicativos complementares
  - H2: Operações e segurança
  - H2: Relacionados

## start/getting-started.md

- Rota: /start/getting-started
- Títulos:
  - H2: O que você precisa
  - H2: Configuração rápida
  - H2: O que fazer em seguida
  - H2: Relacionados

## start/hubs.md

- Rota: /start/hubs
- Títulos:
  - H2: Comece aqui
  - H2: Instalação e atualizações
  - H2: Conceitos fundamentais
  - H2: Provedores e entrada
  - H2: Gateway e operações
  - H2: Ferramentas e automação
  - H2: Nodes, mídia e voz
  - H2: Plataformas
  - H2: Aplicativo complementar para macOS (avançado)
  - H2: Plugins
  - H2: Espaço de trabalho e modelos
  - H2: Projeto
  - H2: Testes e lançamento
  - H2: Relacionados

## start/lore.md

- Rota: /start/lore
- Títulos:
  - H1: A mitologia do OpenClaw 🦞📖
  - H2: A história de origem
  - H2: A primeira muda (27 de janeiro de 2026)
  - H2: O nome
  - H2: Os Daleks contra as lagostas
  - H2: Personagens principais
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: O Moltiverso
  - H2: Os grandes incidentes
  - H3: O despejo de diretório (3 de dezembro de 2025)
  - H3: A grande muda (27 de janeiro de 2026)
  - H3: A forma final (30 de janeiro de 2026)
  - H3: A farra de compras do robô (3 de dezembro de 2025)
  - H2: Textos sagrados
  - H2: O credo da lagosta
  - H3: A saga da geração de ícones (27 de janeiro de 2026)
  - H2: O futuro
  - H2: Relacionados

## start/onboarding-overview.md

- Rota: /start/onboarding-overview
- Títulos:
  - H2: Qual caminho devo usar?
  - H2: O que a integração inicial configura
  - H2: Integração inicial pela CLI
  - H2: Integração inicial pelo aplicativo para macOS
  - H2: Provedores personalizados ou não listados
  - H2: Relacionados

## start/onboarding.md

- Rota: /start/onboarding
- Títulos:
  - H2: Relacionados

## start/openclaw.md

- Rota: /start/openclaw
- Títulos:
  - H2: Segurança em primeiro lugar
  - H2: Pré-requisitos
  - H2: Configuração com dois telefones (recomendada)
  - H2: Início rápido em 5 minutos
  - H2: Forneça um espaço de trabalho ao agente (AGENTS)
  - H2: A configuração que o transforma em "um assistente"
  - H2: Sessões e memória
  - H2: Heartbeats (modo proativo)
  - H2: Entrada e saída de mídia
  - H2: Lista de verificação de operações
  - H2: Próximas etapas
  - H2: Relacionados

## start/quickstart.md

- Rota: /start/quickstart
- Títulos:
  - H2: Relacionados

## start/setup.md

- Rota: /start/setup
- Títulos:
  - H2: Resumo
  - H2: Pré-requisitos (a partir do código-fonte)
  - H2: Estratégia de personalização (para que as atualizações não causem problemas)
  - H2: Execute o Gateway a partir deste repositório
  - H2: Fluxo de trabalho estável (primeiro o aplicativo para macOS)
  - H2: Fluxo de trabalho de ponta (Gateway em um terminal)
  - H3: 0) (Opcional) Execute também o aplicativo para macOS a partir do código-fonte
  - H3: 1) Inicie o Gateway de desenvolvimento
  - H3: 2) Direcione o aplicativo para macOS ao Gateway em execução
  - H3: 3) Verifique
  - H3: Armadilhas comuns
  - H2: Mapa de armazenamento de credenciais
  - H2: Atualização (sem destruir sua configuração)
  - H2: Linux (serviço de usuário do systemd)
  - H2: Documentação relacionada

## start/showcase.md

- Rota: /start/showcase
- Títulos:
  - H2: Novidades do Discord
  - H2: Automação e fluxos de trabalho
  - H2: Conhecimento e memória
  - H2: Voz e telefone
  - H2: Infraestrutura e implantação
  - H2: Casa e hardware
  - H2: Projetos da comunidade
  - H2: Envie seu projeto
  - H2: Relacionados

## start/wizard-cli-automation.md

- Rota: /start/wizard-cli-automation
- Títulos:
  - H2: Exemplo básico não interativo
  - H2: Exemplos específicos de provedores
  - H2: Adicione outro agente
  - H2: Documentação relacionada

## start/wizard-cli-reference.md

- Rota: /start/wizard-cli-reference
- Títulos:
  - H2: O que o assistente de configuração faz
  - H2: Detalhes do fluxo local
  - H2: Detalhes do modo remoto
  - H2: Opções de autenticação e modelo
  - H2: Saídas e detalhes internos
  - H2: Configuração não interativa
  - H2: RPC do assistente de configuração do Gateway
  - H2: Comportamento da configuração do Signal
  - H2: Documentação relacionada

## start/wizard.md

- Rota: /start/wizard
- Títulos:
  - H2: Localidade
  - H2: Padrão guiado
  - H2: Assistente de configuração clássico: QuickStart versus avançado
  - H2: O que a integração inicial clássica configura
  - H2: Adicione outro agente
  - H2: Referência completa
  - H2: Documentação relacionada

## tools/acp-agents-setup.md

- Rota: /tools/acp-agents-setup
- Títulos:
  - H2: Compatibilidade atual com o harness acpx
  - H2: Configuração obrigatória
  - H2: Configuração do Plugin para o backend acpx
  - H3: Sondagem de inicialização do runtime acpx
  - H3: Download automático do adaptador
  - H3: Ponte MCP das ferramentas do Plugin
  - H3: Ponte MCP das ferramentas do OpenClaw
  - H3: Configuração de tempo limite das operações do runtime
  - H3: Configuração do agente de sondagem de integridade
  - H2: Configuração de permissões
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Configuração
  - H2: Relacionados

## tools/acp-agents.md

- Rota: /tools/acp-agents
- Títulos:
  - H2: Qual página eu quero?
  - H2: Isso funciona sem configuração adicional?
  - H2: Alvos de harness compatíveis
  - H2: Manual de operações
  - H2: ACP versus subagentes
  - H2: Como o ACP executa o Claude Code
  - H2: Sessões vinculadas
  - H3: Modelo mental
  - H3: Vínculos da conversa atual
  - H2: Vínculos persistentes de canais
  - H3: Modelo de vinculação
  - H3: Padrões de runtime por agente
  - H3: Exemplo
  - H3: Comportamento
  - H2: Inicie sessões ACP
  - H3: Parâmetros de sessionsspawn
  - H2: Modos de criação, vinculação e thread
  - H2: Modelo de entrega
  - H2: Compatibilidade com sandbox
  - H2: Resolução do alvo da sessão
  - H2: Controles do ACP
  - H3: Mapeamento das opções do runtime
  - H2: Harness acpx, configuração do Plugin e permissões
  - H2: Solução de problemas
  - H2: Relacionados

## tools/agent-send.md

- Rota: /tools/agent-send
- Títulos:
  - H2: Início rápido
  - H2: Opções
  - H2: Comportamento
  - H2: Exemplos
  - H2: Relacionados

## tools/apply-patch.md

- Rota: /tools/apply-patch
- Títulos:
  - H2: Parâmetros
  - H2: Observações
  - H2: Exemplo
  - H2: Relacionados

## tools/brave-search.md

- Rota: /tools/brave-search
- Títulos:
  - H2: Obtenha uma chave de API
  - H2: Exemplo de configuração
  - H2: Parâmetros da ferramenta
  - H2: Observações
  - H2: Relacionados

## tools/browser-control.md

- Rota: /tools/browser-control
- Títulos:
  - H2: API de controle (opcional)
  - H3: Contrato de erro de /act
  - H3: Requisito do Playwright
  - H4: Instalação do Playwright no Docker
  - H2: Como funciona (internamente)
  - H2: Referência rápida da CLI
  - H2: Snapshots e referências
  - H2: Recursos avançados de espera
  - H2: Fluxos de trabalho de depuração
  - H2: Saída JSON
  - H2: Controles de estado e ambiente
  - H2: Segurança e privacidade
  - H2: Relacionados

## tools/browser-linux-troubleshooting.md

- Rota: /tools/browser-linux-troubleshooting
- Títulos:
  - H2: Problema: falha ao iniciar o CDP do Chrome na porta 18800
  - H3: Causa raiz
  - H3: Solução 1: instale o Google Chrome (recomendado)
  - H3: Solução 2: use o Chromium via snap no modo somente anexação
  - H3: Verifique se o navegador funciona
  - H3: Referência de configuração
  - H3: Problema: nenhuma guia do Chrome foi encontrada para profile="user"
  - H2: Relacionados

## tools/browser-login.md

- Rota: /tools/browser-login
- Títulos:
  - H2: Login manual (recomendado)
  - H2: Qual perfil do Chrome é usado?
  - H2: Sandbox: permita o acesso ao navegador do host
  - H2: Relacionados

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Rota: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Títulos:
  - H2: Primeiro, escolha o modo correto do navegador
  - H3: Opção 1: CDP remoto direto do WSL2 para o Windows
  - H3: Opção 2: MCP do Chrome local ao host
  - H2: Arquitetura funcional
  - H2: Regra essencial para a interface de controle
  - H2: Valide em camadas
  - H3: Camada 1: verifique se o Chrome está disponibilizando o CDP no Windows
  - H4: Diagnostique IPv4 e IPv6 antes de alterar o portproxy
  - H3: Camada 2: verifique se o WSL2 consegue acessar esse endpoint do Windows
  - H3: Camada 3: configure o perfil correto do navegador
  - H3: Camada 4: verifique separadamente a camada da interface de controle
  - H3: Camada 5: verifique o controle do navegador de ponta a ponta
  - H2: Erros comuns que induzem a interpretações incorretas
  - H2: Lista de verificação para triagem rápida
  - H2: Relacionados

## tools/browser.md

- Rota: /tools/browser
- Títulos:
  - H2: O que você recebe
  - H2: Início rápido
  - H2: Controle do Plugin
  - H2: Orientações para o agente
  - H2: Comando ou ferramenta de navegador ausente
  - H2: Perfis: openclaw, user, chrome
  - H2: Configuração
  - H3: Visão de capturas de tela (compatibilidade com modelos somente de texto)
  - H2: Usar o Brave ou outro navegador baseado no Chromium
  - H2: Controle local versus remoto
  - H2: Proxy de navegador do Node (padrão sem configuração)
  - H2: Browserless (CDP remoto hospedado)
  - H3: Browserless Docker no mesmo host
  - H2: Provedores de CDP WebSocket direto
  - H3: Browserbase
  - H3: Notte
  - H2: Segurança
  - H2: Perfis (vários navegadores)
  - H2: Sessão existente por meio do Chrome DevTools MCP
  - H3: Inicialização personalizada do Chrome MCP
  - H2: Garantias de isolamento
  - H2: Seleção do navegador
  - H2: API de controle (opcional)
  - H2: Solução de problemas
  - H3: Falha na inicialização do CDP versus bloqueio de SSRF na navegação
  - H2: Ferramentas do agente e como o controle funciona
  - H2: Relacionados

## tools/btw.md

- Rota: /tools/btw
- Títulos:
  - H2: O que faz
  - H2: O que não faz
  - H2: Modelo de entrega
  - H2: Comportamento da interface
  - H2: Janela pop-up de seleção (interface de controle)
  - H2: Quando usar
  - H2: Relacionados

## tools/capability-cookbook.md

- Rota: /tools/capability-cookbook
- Títulos:
  - H2: Relacionados

## tools/chrome-extension.md

- Rota: /tools/chrome-extension
- Títulos:
  - H1: Extensão do Chrome
  - H2: Como funciona
  - H2: Instalar e parear
  - H2: Como usar
  - H2: Remoto/entre máquinas
  - H2: Diagnóstico
  - H2: Modelo de segurança

## tools/clawhub.md

- Rota: /tools/clawhub
- Títulos: nenhum

## tools/code-execution.md

- Rota: /tools/code-execution
- Títulos:
  - H2: Configuração
  - H2: Como usar
  - H2: Erros
  - H2: Relacionados

## tools/creating-skills.md

- Rota: /tools/creating-skills
- Títulos:
  - H2: Crie sua primeira skill
  - H2: Referência do SKILL.md
  - H3: Campos obrigatórios
  - H3: Chaves opcionais do frontmatter
  - H3: Como usar {baseDir}
  - H2: Adicionar ativação condicional
  - H2: Propor por meio da Oficina de Skills
  - H2: Publicar no ClawHub
  - H2: Práticas recomendadas
  - H2: Relacionados

## tools/diffs.md

- Rota: /tools/diffs
- Títulos:
  - H2: Início rápido
  - H2: Desativar as orientações integradas do sistema
  - H2: Referência de entrada da ferramenta
  - H2: Realce de sintaxe
  - H2: Contrato de detalhes da saída
  - H3: Seções inalteradas recolhidas
  - H3: Navegação entre vários arquivos
  - H2: Padrões do Plugin
  - H3: Configuração persistente da URL do visualizador
  - H2: Configuração de segurança
  - H2: Ciclo de vida e armazenamento de artefatos
  - H2: URL do visualizador e comportamento de rede
  - H2: Modelo de segurança
  - H2: Requisitos do navegador para o modo de arquivo
  - H2: Solução de problemas
  - H2: Orientações operacionais
  - H2: Relacionados

## tools/duckduckgo-search.md

- Rota: /tools/duckduckgo-search
- Títulos:
  - H2: Configuração
  - H2: Configuração
  - H2: Parâmetros da ferramenta
  - H2: Observações
  - H2: Relacionados

## tools/elevated.md

- Rota: /tools/elevated
- Títulos:
  - H2: Diretivas
  - H2: Como funciona
  - H2: Ordem de resolução
  - H2: Disponibilidade e listas de permissões
  - H2: O que o modo elevado não controla
  - H2: Relacionados

## tools/exa-search.md

- Rota: /tools/exa-search
- Títulos:
  - H2: Instalar o Plugin
  - H2: Obter uma chave de API
  - H2: Configuração
  - H2: Substituição da URL base
  - H2: Parâmetros da ferramenta
  - H3: Extração de conteúdo
  - H3: Modos de pesquisa
  - H2: Observações
  - H2: Relacionados

## tools/exec-approvals-advanced.md

- Rota: /tools/exec-approvals-advanced
- Títulos:
  - H2: Binários seguros (somente stdin)
  - H3: Validação de argv e flags negadas
  - H3: Diretórios de binários confiáveis
  - H3: Encadeamento de shell, wrappers e multiplexadores
  - H3: Binários seguros versus lista de permissões
  - H2: Comandos de interpretador/runtime
  - H3: Comportamento de entrega subsequente
  - H2: Encaminhamento de aprovações para canais de chat
  - H3: Encaminhamento de aprovações do Plugin
  - H3: Aprovações no mesmo chat em qualquer canal
  - H3: Entrega nativa de aprovações
  - H3: Aplicativos móveis oficiais para operadores
  - H3: Fluxo de IPC do macOS
  - H2: Perguntas frequentes
  - H3: Quando accountId e threadId seriam usados em um destino de aprovação?
  - H3: Quando as aprovações são enviadas a uma sessão, qualquer pessoa nessa sessão pode aprová-las?
  - H2: Relacionados

## tools/exec-approvals.md

- Rota: /tools/exec-approvals
- Títulos:
  - H2: Onde se aplica
  - H3: Modelo de confiança
  - H3: Divisão no macOS
  - H2: Inspecionar a política efetiva
  - H2: Configurações e armazenamento
  - H2: Controles da política
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Modo YOLO (sem aprovação)
  - H3: Configuração persistente de "nunca solicitar" no host do Gateway
  - H3: Atalho local
  - H3: Host do Node
  - H3: Atalho somente para a sessão
  - H2: Lista de permissões (por agente)
  - H3: Restringir argumentos com argPattern
  - H2: Permitir automaticamente CLIs de skills
  - H2: Binários seguros e encaminhamento de aprovações
  - H2: Edição na interface de controle
  - H2: Fluxo de aprovação
  - H2: Eventos do sistema e recusas
  - H2: Implicações
  - H2: Relacionados

## tools/exec.md

- Rota: /tools/exec
- Títulos:
  - H2: Parâmetros
  - H2: Configuração
  - H3: Modos
  - H3: Avaliação inline (strictInlineEval)
  - H3: Tratamento de PATH
  - H2: Substituições da sessão (/exec)
  - H2: Aprovações de execução (aplicativo complementar/host do Node)
  - H2: Lista de permissões + binários seguros
  - H2: Exemplos
  - H2: applypatch
  - H2: Relacionados

## tools/firecrawl.md

- Rota: /tools/firecrawl
- Títulos:
  - H2: Instalar o Plugin
  - H2: webfetch sem chave e chaves de API
  - H2: Configurar a pesquisa do Firecrawl
  - H2: Configurar o fallback de webfetch do Firecrawl
  - H3: Firecrawl auto-hospedado
  - H2: Ferramentas do Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Discrição/evasão de bots
  - H2: Como o webfetch usa o Firecrawl
  - H2: Relacionados

## tools/gemini-search.md

- Rota: /tools/gemini-search
- Títulos:
  - H2: Obter uma chave de API
  - H2: Configuração
  - H2: Como funciona
  - H2: Parâmetros compatíveis
  - H2: Seleção do modelo
  - H2: Substituições da URL base
  - H2: Relacionados

## tools/goal.md

- Rota: /tools/goal
- Títulos:
  - H1: Objetivo
  - H2: Início rápido
  - H2: Para que servem os objetivos
  - H2: Referência de comandos
  - H2: Status
  - H2: Orçamentos de tokens
  - H2: Ferramentas de modelo
  - H2: Contexto do objetivo em cada turno
  - H2: Interface de controle
  - H2: TUI
  - H2: Comportamento do canal
  - H2: Solução de problemas
  - H2: Relacionados

## tools/grok-search.md

- Rota: /tools/grok-search
- Títulos:
  - H2: Integração inicial e configuração
  - H2: Entrar ou obter uma chave de API
  - H2: Configuração
  - H2: Como funciona
  - H2: Parâmetros compatíveis
  - H2: Substituições da URL base
  - H2: Relacionados

## tools/image-generation.md

- Rota: /tools/image-generation
- Títulos:
  - H2: Início rápido
  - H2: Rotas comuns
  - H2: Provedores compatíveis
  - H2: Recursos dos provedores
  - H2: Parâmetros da ferramenta
  - H2: Configuração
  - H3: Seleção do modelo
  - H3: Ordem de seleção dos provedores
  - H3: Edição de imagens
  - H2: Análises detalhadas dos provedores
  - H2: Exemplos
  - H2: Relacionados

## tools/index.md

- Rota: /tools
- Títulos:
  - H2: Comece aqui
  - H2: Escolha ferramentas, skills ou plugins
  - H2: Categorias de ferramentas integradas
  - H2: Ferramentas fornecidas por plugins
  - H2: Configurar acesso e aprovações
  - H2: Ampliar recursos
  - H2: Solucionar problemas de ferramentas ausentes
  - H2: Relacionados

## tools/kimi-search.md

- Rota: /tools/kimi-search
- Títulos:
  - H2: Configuração
  - H2: Configuração
  - H2: Requisito de fundamentação
  - H2: Parâmetros da ferramenta
  - H2: Relacionados

## tools/llm-task.md

- Rota: /tools/llm-task
- Títulos:
  - H2: Ativar
  - H2: Configuração (opcional)
  - H2: Parâmetros da ferramenta
  - H2: Saída
  - H2: Exemplo: etapa de fluxo de trabalho do Lobster
  - H3: Limitação importante
  - H2: Observações de segurança
  - H2: Relacionados

## tools/lobster.md

- Rota: /tools/lobster
- Títulos:
  - H2: Por quê
  - H2: Como funciona
  - H2: Ativar
  - H2: Padrão: CLI pequena + pipes JSON + aprovações
  - H2: Etapas de LLM somente em JSON (llm-task)
  - H3: Limitação importante: Lobster incorporado versus openclaw.invoke
  - H2: Arquivos de fluxo de trabalho (.lobster)
  - H2: Parâmetros da ferramenta
  - H3: run
  - H3: resume
  - H3: Modo de fluxo de tarefas gerenciado
  - H2: Envelope de saída
  - H2: Aprovações
  - H2: OpenProse
  - H2: Segurança
  - H2: Solução de problemas
  - H2: Saiba mais
  - H2: Estudo de caso: fluxos de trabalho da comunidade
  - H2: Relacionados

## tools/loop-detection.md

- Rota: /tools/loop-detection
- Títulos:
  - H2: Por que isto existe
  - H2: Bloco de configuração
  - H3: Comportamento dos campos
  - H2: Configuração recomendada
  - H2: Proteção pós-Compaction
  - H2: Logs e comportamento esperado
  - H2: Relacionados

## tools/media-overview.md

- Rota: /tools/media-overview
- Títulos:
  - H2: Recursos
  - H2: Matriz de recursos dos provedores
  - H2: Assíncrono versus síncrono
  - H2: Conversão de fala em texto e chamada de voz
  - H2: Mapeamentos de provedores (como os fornecedores se dividem entre as interfaces)
  - H2: Relacionados

## tools/minimax-search.md

- Rota: /tools/minimax-search
- Títulos:
  - H2: Obter uma credencial do Token Plan
  - H2: Configuração
  - H2: Seleção de região
  - H2: Parâmetros compatíveis
  - H2: Relacionados

## tools/multi-agent-sandbox-tools.md

- Rota: /tools/multi-agent-sandbox-tools
- Títulos:
  - H2: Exemplos de configuração
  - H2: Precedência da configuração
  - H3: Configuração do sandbox
  - H3: Restrições de ferramentas
  - H2: Migração de agente único
  - H2: Exemplos de restrições de ferramentas
  - H2: Armadilha comum: "non-main"
  - H2: Testes
  - H2: Solução de problemas
  - H2: Relacionados

## tools/music-generation.md

- Rota: /tools/music-generation
- Títulos:
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H3: Matriz de recursos
  - H2: Parâmetros da ferramenta
  - H2: Comportamento assíncrono
  - H3: Ciclo de vida da tarefa
  - H2: Configuração
  - H3: Seleção do modelo
  - H3: Ordem de seleção dos provedores
  - H2: Observações sobre os provedores
  - H2: Escolher o caminho certo
  - H2: Modos de recursos dos provedores
  - H2: Testes em tempo real
  - H2: Relacionados

## tools/ollama-search.md

- Rota: /tools/ollama-search
- Títulos:
  - H2: Configuração
  - H2: Configuração
  - H2: Autenticação e roteamento de solicitações
  - H2: Relacionados

## tools/parallel-search.md

- Rota: /tools/parallel-search
- Títulos:
  - H2: Instalar o Plugin
  - H2: Chave de API (provedor pago)
  - H2: Configuração
  - H2: Substituição da URL base
  - H2: Parâmetros da ferramenta
  - H2: Observações
  - H2: Relacionados

## tools/pdf.md

- Rota: /tools/pdf
- Títulos:
  - H2: Disponibilidade
  - H2: Referência de entrada
  - H2: Referências de PDF compatíveis
  - H2: Modos de execução
  - H3: Modo nativo do provedor
  - H3: Modo de fallback de extração
  - H2: Configuração
  - H2: Detalhes da saída
  - H2: Comportamento em caso de erro
  - H2: Exemplos
  - H2: Relacionados

## tools/permission-modes.md

- Rota: /tools/permission-modes
- Títulos:
  - H2: Padrão recomendado
  - H2: Modos de execução do host do OpenClaw
  - H2: Mapeamento do Codex Guardian
  - H2: Permissões do harness ACPX
  - H2: Escolher um modo
  - H2: Relacionados

## tools/perplexity-search.md

- Rota: /tools/perplexity-search
- Títulos:
  - H2: Instalar o Plugin
  - H2: Obter uma chave de API da Perplexity
  - H2: Compatibilidade com OpenRouter
  - H2: Exemplos de configuração
  - H3: API nativa de pesquisa da Perplexity
  - H3: Compatibilidade com OpenRouter/Sonar
  - H2: Onde definir a chave
  - H2: Parâmetros da ferramenta
  - H3: Regras de filtro de domínio
  - H2: Observações
  - H2: Relacionados

## tools/plugin.md

- Rota: /tools/plugin
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Configuração
  - H3: Escolher uma fonte de instalação
  - H3: Política de instalação do operador
  - H3: Configurar a política do Plugin
  - H2: Entender os formatos de Plugin
  - H2: Hooks de Plugin
  - H2: Verificar o Gateway ativo
  - H2: Solução de problemas
  - H3: Propriedade bloqueada do caminho do Plugin
  - H3: Configuração lenta das ferramentas do Plugin
  - H2: Relacionados

## tools/reactions.md

- Rota: /tools/reactions
- Títulos:
  - H2: Como funciona
  - H2: Comportamento do canal
  - H2: Nível de reação
  - H2: Relacionados

## tools/searxng-search.md

- Rota: /tools/searxng-search
- Títulos:
  - H2: Configuração
  - H2: Configuração
  - H2: Variável de ambiente
  - H2: Referência de configuração do Plugin
  - H2: Observações
  - H2: Relacionados

## tools/show-widget.md

- Rota: /tools/show-widget
- Títulos:
  - H2: Usar a ferramenta
  - H2: Segurança e armazenamento
  - H2: Relacionados

## tools/skill-workshop.md

- Rota: /tools/skill-workshop
- Títulos:
  - H2: Como funciona
  - H2: Ciclo de vida
  - H2: Curadoria do ciclo de vida
  - H2: Chat
  - H3: Aprender com trabalhos recentes
  - H2: CLI
  - H2: Conteúdo da proposta
  - H2: Arquivos de suporte
  - H2: Ferramenta do agente
  - H2: Skills sugeridas
  - H2: Aprovação e autonomia
  - H2: Métodos do Gateway
  - H2: Armazenamento
  - H2: Limites
  - H2: Solução de problemas
  - H3: Diagnóstico da política de ferramentas
  - H2: Conteúdo relacionado

## tools/skills-config.md

- Rota: /tools/skills-config
- Títulos:
  - H2: Carregamento (skills.load)
  - H2: Instalação (skills.install)
  - H2: Política de instalação do operador (security.installPolicy)
  - H2: Lista de permissões de Skills incluídas
  - H2: Entradas por Skill (skills.entries)
  - H2: Listas de permissões de agentes (agents)
  - H2: Workshop (skills.workshop)
  - H2: Raízes de Skills vinculadas simbolicamente
  - H2: Skills em sandbox e variáveis de ambiente
  - H2: Lembrete da ordem de carregamento
  - H2: Conteúdo relacionado

## tools/skills.md

- Rota: /tools/skills
- Títulos:
  - H2: Ordem de carregamento
  - H2: Skills hospedadas em Node
  - H2: Skills por agente versus compartilhadas
  - H2: Listas de permissões de agentes
  - H2: Plugins e Skills
  - H2: Workshop de Skills
  - H2: Instalação pelo ClawHub
  - H2: Segurança
  - H2: Formato do SKILL.md
  - H3: Chaves opcionais do frontmatter
  - H2: Controle de acesso
  - H3: Especificações do instalador
  - H2: Substituições de configuração
  - H2: Injeção de ambiente
  - H2: Snapshots e atualização
  - H2: Impacto nos tokens
  - H2: Conteúdo relacionado

## tools/slash-commands.md

- Rota: /tools/slash-commands
- Títulos:
  - H2: Três tipos de comando
  - H2: Configuração
  - H2: Lista de comandos
  - H3: Comandos principais
  - H3: Comandos do Dock
  - H3: Comandos de Plugins incluídos
  - H3: Comandos de Skills
  - H2: /tools: o que o agente pode usar agora
  - H2: /model: seleção de modelo
  - H2: /config: gravações da configuração em disco
  - H2: /mcp: configuração do servidor MCP
  - H2: /debug: substituições somente em tempo de execução
  - H2: /plugins: gerenciamento de Plugins
  - H2: /trace: saída de rastreamento de Plugins
  - H2: /btw: perguntas paralelas
  - H2: Observações sobre as interfaces
  - H2: Uso e status do provedor
  - H2: Conteúdo relacionado

## tools/steer.md

- Rota: /tools/steer
- Títulos:
  - H2: Sessão atual
  - H2: Direcionamento versus fila
  - H2: Subagentes
  - H2: Sessões ACP
  - H2: Conteúdo relacionado

## tools/subagents.md

- Rota: /tools/subagents
- Títulos:
  - H2: Comando de barra
  - H3: Controles de vinculação a threads
  - H3: Comportamento de criação
  - H2: Modos de contexto
  - H2: Ferramenta: sessionsspawn
  - H3: Modo de prompt de delegação
  - H3: Parâmetros da ferramenta
  - H3: Nomes e direcionamento de tarefas
  - H2: Ferramenta: sessionsyield
  - H2: Ferramenta: subagents
  - H2: Sessões vinculadas a threads
  - H3: Canais compatíveis com threads
  - H3: Fluxo rápido
  - H3: Controles manuais
  - H3: Opções de configuração
  - H3: Lista de permissões
  - H3: Descoberta
  - H3: Arquivamento automático
  - H2: Subagentes aninhados
  - H3: Níveis de profundidade
  - H3: Cadeia de anúncios
  - H3: Política de ferramentas por profundidade
  - H3: Limite de criação por agente
  - H3: Interrupção em cascata
  - H2: Autenticação
  - H2: Anúncio
  - H3: Contexto do anúncio
  - H3: Linha de estatísticas
  - H3: Por que preferir sessionshistory
  - H2: Política de ferramentas
  - H3: Substituição pela configuração
  - H2: Simultaneidade
  - H2: Disponibilidade e recuperação
  - H2: Interrupção
  - H2: Limitações
  - H2: Conteúdo relacionado

## tools/tavily.md

- Rota: /tools/tavily
- Títulos:
  - H2: Primeiros passos
  - H2: Referência das ferramentas
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Escolha da ferramenta certa
  - H2: Configuração avançada
  - H2: Conteúdo relacionado

## tools/thinking.md

- Rota: /tools/thinking
- Títulos:
  - H2: O que faz
  - H2: Ordem de resolução
  - H2: Definição de um padrão para a sessão
  - H2: Aplicação por agente
  - H2: Modo rápido (/fast)
  - H2: Diretivas detalhadas (/verbose ou /v)
  - H2: Diretivas de rastreamento de Plugins (/trace)
  - H2: Visibilidade do raciocínio (/reasoning)
  - H2: Conteúdo relacionado
  - H2: Heartbeats
  - H2: Interface de chat na web
  - H2: Perfis de provedores

## tools/tokenjuice.md

- Rota: /tools/tokenjuice
- Títulos:
  - H2: Ativar o Plugin
  - H2: O que o Tokenjuice altera
  - H2: Verificar se está funcionando
  - H2: Desativar o Plugin
  - H2: Conteúdo relacionado

## tools/tool-search.md

- Rota: /tools/tool-search
- Títulos:
  - H2: Como um turno é executado
  - H2: Modos
  - H2: Por que isso existe
  - H2: API
  - H2: Limite do ambiente de execução
  - H2: Configuração
  - H2: Prompt e telemetria
  - H2: Validação E2E
  - H2: Comportamento em caso de falha
  - H2: Conteúdo relacionado

## tools/trajectory.md

- Rota: /tools/trajectory
- Títulos:
  - H2: Início rápido
  - H2: Acesso
  - H2: O que é registrado
  - H2: Arquivos do pacote
  - H2: Armazenamento das capturas
  - H2: Desativação da captura
  - H2: Ajuste do tempo limite de descarga
  - H2: Privacidade e limites
  - H2: Solução de problemas
  - H2: Conteúdo relacionado

## tools/tts.md

- Rota: /tools/tts
- Títulos:
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H2: Configuração
  - H3: Substituições de voz por agente
  - H2: Personas
  - H3: Persona mínima
  - H3: Persona completa (prompt independente de provedor)
  - H3: Resolução da persona
  - H3: Como os provedores usam prompts de persona
  - H3: Política de contingência
  - H2: Diretivas orientadas pelo modelo
  - H2: Comandos de barra
  - H2: Preferências por usuário
  - H2: Formatos de saída
  - H2: Comportamento do TTS automático
  - H2: Referência dos campos
  - H2: Ferramenta do agente
  - H2: RPC do Gateway
  - H2: Links dos serviços
  - H2: Conteúdo relacionado

## tools/video-generation.md

- Rota: /tools/video-generation
- Títulos:
  - H2: Início rápido
  - H2: Como funciona a geração assíncrona
  - H3: Ciclo de vida da tarefa
  - H2: Provedores compatíveis
  - H3: Matriz de recursos
  - H2: Parâmetros da ferramenta
  - H3: Obrigatórios
  - H3: Entradas de conteúdo
  - H3: Controles de estilo
  - H3: Avançados
  - H4: Contingência e opções tipadas
  - H2: Ações
  - H2: Seleção de modelo
  - H2: Observações sobre provedores
  - H2: Modos de recursos dos provedores
  - H2: Testes em ambiente real
  - H2: Configuração
  - H2: Conteúdo relacionado

## tools/web-fetch.md

- Rota: /tools/web-fetch
- Títulos:
  - H2: Início rápido
  - H2: Parâmetros da ferramenta
  - H2: Como funciona
  - H2: Atualizações de progresso
  - H2: Configuração
  - H2: Contingência com o Firecrawl
  - H2: Proxy de ambiente confiável
  - H2: Limites e segurança
  - H2: Perfis de ferramentas
  - H2: Conteúdo relacionado

## tools/web.md

- Rota: /tools/web
- Títulos:
  - H2: Início rápido
  - H2: Escolha de um provedor
  - H3: Comparação de provedores
  - H2: Detecção automática
  - H2: Pesquisa nativa na web da OpenAI
  - H2: Pesquisa nativa na web do Codex
  - H2: Segurança de rede
  - H2: Configuração
  - H3: Armazenamento de chaves de API
  - H2: Parâmetros da ferramenta
  - H2: xsearch
  - H3: Configuração do xsearch
  - H3: Parâmetros do xsearch
  - H3: Exemplo de xsearch
  - H2: Exemplos
  - H2: Perfis de ferramentas
  - H2: Conteúdo relacionado

## tts.md

- Rota: /tts
- Títulos:
  - H2: Conteúdo relacionado

## vps.md

- Rota: /vps
- Títulos:
  - H2: Escolha de um provedor
  - H2: Como funcionam as configurações na nuvem
  - H2: Primeiro, proteja o acesso administrativo
  - H2: Agente compartilhado da empresa em uma VPS
  - H2: Uso de Nodes com uma VPS
  - H2: Ajuste da inicialização para VMs pequenas e hosts ARM
  - H3: Lista de verificação de ajustes do systemd (opcional)
  - H2: Conteúdo relacionado

## web/control-ui.md

- Rota: /web/control-ui
- Títulos:
  - H2: Abertura rápida (local)
  - H2: Pareamento de dispositivo (primeira conexão)
  - H2: Parear um dispositivo móvel
  - H2: Identidade pessoal (local do navegador)
  - H2: Endpoint de configuração do ambiente de execução
  - H2: Status do host do Gateway
  - H2: Suporte a idiomas
  - H2: Temas de aparência
  - H2: Gerenciar Plugins
  - H2: Navegação pela barra lateral
  - H2: Página de nova sessão
  - H2: O que pode fazer (atualmente)
  - H2: Página do MCP
  - H2: Guia de atividade
  - H2: Terminal do operador
  - H2: Painel do navegador
  - H2: Comportamento do chat
  - H2: Perda de conexão e reconexão
  - H2: Instalação como PWA e notificações push na web
  - H2: Incorporações hospedadas
  - H2: Largura das mensagens do chat
  - H2: Acesso pela tailnet (recomendado)
  - H2: HTTP inseguro
  - H2: Política de segurança de conteúdo
  - H2: Autenticação da rota do avatar
  - H2: Autenticação da rota de mídia do assistente
  - H2: Links de aprovação
  - H2: Página em branco da interface de controle
  - H2: Depuração/testes: servidor de desenvolvimento + Gateway remoto
  - H2: Conteúdo relacionado

## web/dashboard.md

- Rota: /web/dashboard
- Títulos:
  - H2: Caminho rápido (recomendado)
  - H2: Conceitos básicos de autenticação (local versus remoto)
  - H2: Abrir no Telegram
  - H2: Se você vir "unauthorized" / 1008
  - H2: Conteúdo relacionado

## web/index.md

- Rota: /web
- Títulos:
  - H2: Configuração (ativada por padrão)
  - H2: Webhooks
  - H2: RPC HTTP de administração
  - H2: Acesso pelo Tailscale
  - H2: Observações de segurança
  - H2: Compilação da interface

## web/lobster.md

- Rota: /web/lobster
- Títulos:
  - H2: O que você está vendo
  - H2: Quando aparece
  - H2: O que você pode fazer
  - H2: Desativação das visitas (ou reativação)
  - H2: O Lobsterdex
  - H2: Notas de campo
  - H2: Privacidade

## web/tui.md

- Rota: /web/tui
- Títulos:
  - H2: Início rápido
  - H3: Modo Gateway
  - H3: Modo local
  - H2: O que você vê
  - H2: Modelo mental: agentes + sessões
  - H2: Envio + entrega
  - H2: Seletores + sobreposições
  - H2: Atalhos de teclado
  - H2: Comandos de barra
  - H2: Comandos do shell local
  - H2: Auxiliar de configuração e reparo do Crestodian
  - H2: Saída das ferramentas
  - H2: Cores do terminal
  - H2: Histórico + streaming
  - H2: Detalhes da conexão
  - H2: Opções
  - H2: Solução de problemas
  - H2: Solução de problemas de conexão
  - H2: Conteúdo relacionado

## web/webchat.md

- Rota: /web/webchat
- Títulos:
  - H2: O que é
  - H2: Início rápido
  - H2: Como funciona
  - H3: Modelo de transcrição e entrega
  - H2: Painel de ferramentas dos agentes na interface de controle
  - H2: Uso remoto
  - H2: Referência de configuração (WebChat)
  - H2: Conteúdo relacionado

## web/workspaces.md

- Rota: /web/workspaces
- Títulos:
  - H2: Ativar espaços de trabalho
  - H2: O espaço de trabalho padrão
  - H2: Widgets integrados
  - H2: Proveniência
  - H2: Widgets personalizados
  - H2: CLI
  - H2: Armazenamento
