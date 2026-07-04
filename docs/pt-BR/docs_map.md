---
read_when: Finding which docs page covers a topic before reading the page
summary: Mapa de títulos gerado para páginas da documentação do OpenClaw
title: Mapa da documentação
x-i18n:
    generated_at: "2026-07-04T03:39:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1f240dc2ccee730a5d3b0cc3695d0ed17429dff4a0e0ffff8569ac92e34231ea
    source_path: docs_map.md
    workflow: 16
---

# Mapa da documentação do OpenClaw

Este arquivo é gerado a partir dos títulos de `docs/**/*.md` e `docs/**/*.mdx` para ajudar agentes a navegar pela árvore de documentação.
Não edite manualmente; execute `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Rota: /agent-runtime-architecture
- Títulos:
  - H2: Layout de runtime
  - H2: Limites
  - H2: Manifestos
  - H2: Seleção de runtime
  - H2: Relacionado

## announcements/bluebubbles-imessage.md

- Rota: /announcements/bluebubbles-imessage
- Títulos:
  - H1: Remoção do BlueBubbles e o caminho imsg para iMessage
  - H2: O que mudou
  - H2: O que fazer
  - H2: Notas de migração
  - H2: Veja também

## auth-credential-semantics.md

- Rota: /auth-credential-semantics
- Títulos:
  - H2: Códigos de motivo de sondagem estáveis
  - H2: Credenciais de token
  - H3: Regras de elegibilidade
  - H3: Regras de resolução
  - H2: Portabilidade de cópia do agente
  - H2: Rotas de autenticação somente por configuração
  - H2: Filtragem explícita da ordem de autenticação
  - H2: Resolução do alvo da sondagem
  - H2: Descoberta de credenciais da CLI externa
  - H2: Proteção de política SecretRef do OAuth
  - H2: Mensagens compatíveis com legado
  - H2: Relacionado

## automation/auth-monitoring.md

- Rota: /automation/auth-monitoring
- Títulos:
  - H2: Relacionado

## automation/clawflow.md

- Rota: /automation/clawflow
- Títulos:
  - H2: Relacionado

## automation/cron-jobs.md

- Rota: /automation/cron-jobs
- Títulos:
  - H2: Início rápido
  - H2: Como o cron funciona
  - H2: Tipos de agendamento
  - H3: Dia do mês e dia da semana usam lógica OR
  - H2: Estilos de execução
  - H3: Payloads de comando
  - H3: Opções de payload para trabalhos isolados
  - H2: Entrega e saída
  - H2: Idioma da saída
  - H2: Exemplos de CLI
  - H2: Webhooks
  - H3: Autenticação
  - H2: Integração com Gmail PubSub
  - H3: Configuração pelo assistente (recomendado)
  - H3: Inicialização automática do Gateway
  - H3: Configuração manual única
  - H3: Substituição de modelo do Gmail
  - H2: Gerenciamento de trabalhos
  - H2: Configuração
  - H2: Solução de problemas
  - H3: Escada de comandos
  - H2: Relacionado

## automation/cron-vs-heartbeat.md

- Rota: /automation/cron-vs-heartbeat
- Títulos:
  - H2: Relacionado

## automation/gmail-pubsub.md

- Rota: /automation/gmail-pubsub
- Títulos:
  - H2: Relacionado

## automation/hooks.md

- Rota: /automation/hooks
- Títulos:
  - H2: Escolha a superfície certa
  - H2: Início rápido
  - H2: Tipos de evento
  - H2: Escrevendo hooks
  - H3: Estrutura de hook
  - H3: Formato HOOK.md
  - H3: Implementação do handler
  - H3: Destaques do contexto do evento
  - H2: Descoberta de hooks
  - H3: Pacotes de hooks
  - H2: Hooks incluídos
  - H3: Detalhes de session-memory
  - H3: Configuração bootstrap-extra-files
  - H3: Detalhes de command-logger
  - H3: Detalhes de compaction-notifier
  - H3: Detalhes de boot-md
  - H2: Hooks de Plugin
  - H2: Configuração
  - H2: Referência da CLI
  - H2: Práticas recomendadas
  - H2: Solução de problemas
  - H3: Hook não descoberto
  - H3: Hook não elegível
  - H3: Hook não executando
  - H2: Relacionado

## automation/index.md

- Rota: /automation
- Títulos:
  - H2: Guia rápido de decisão
  - H3: Tarefas agendadas (Cron) vs Heartbeat
  - H2: Conceitos principais
  - H3: Tarefas agendadas (cron)
  - H3: Tarefas
  - H3: Compromissos inferidos
  - H3: Task Flow
  - H3: Ordens permanentes
  - H3: Hooks
  - H3: Heartbeat
  - H2: Como funcionam juntos
  - H2: Relacionado

## automation/poll.md

- Rota: /automation/poll
- Títulos:
  - H2: Relacionado

## automation/standing-orders.md

- Rota: /automation/standing-orders
- Títulos:
  - H2: Por que usar ordens permanentes
  - H2: Como elas funcionam
  - H2: Anatomia de uma ordem permanente
  - H2: Ordens permanentes mais trabalhos cron
  - H2: Exemplos
  - H3: Exemplo 1: conteúdo e redes sociais (ciclo semanal)
  - H3: Exemplo 2: operações financeiras (acionadas por evento)
  - H3: Exemplo 3: monitoramento e alertas (contínuo)
  - H2: Padrão executar-verificar-relatar
  - H2: Arquitetura multiprograma
  - H2: Práticas recomendadas
  - H3: Faça
  - H3: Evite
  - H2: Relacionado

## automation/taskflow.md

- Rota: /automation/taskflow
- Títulos:
  - H2: Quando usar Task Flow
  - H2: Padrão de workflow agendado confiável
  - H2: Modos de sincronização
  - H3: Modo gerenciado
  - H3: Modo espelhado
  - H2: Estado durável e rastreamento de revisões
  - H2: Comportamento de cancelamento
  - H2: Comandos da CLI
  - H2: Como fluxos se relacionam com tarefas
  - H2: Relacionado

## automation/tasks.md

- Rota: /automation/tasks
- Títulos:
  - H2: TL;DR
  - H2: Início rápido
  - H2: O que cria uma tarefa
  - H2: Ciclo de vida da tarefa
  - H2: Entrega e notificações
  - H3: Políticas de notificação
  - H2: Referência da CLI
  - H2: Quadro de tarefas do chat (/tasks)
  - H2: Integração de status (pressão de tarefas)
  - H2: Armazenamento e manutenção
  - H3: Onde as tarefas ficam
  - H3: Manutenção automática
  - H2: Como as tarefas se relacionam com outros sistemas
  - H2: Relacionado

## automation/troubleshooting.md

- Rota: /automation/troubleshooting
- Títulos:
  - H2: Relacionado

## automation/webhook.md

- Rota: /automation/webhook
- Títulos:
  - H2: Relacionado

## brave-search.md

- Rota: /brave-search
- Títulos:
  - H2: Relacionado

## channels/access-groups.md

- Rota: /channels/access-groups
- Títulos:
  - H2: Grupos estáticos de remetentes de mensagens
  - H2: Referenciar grupos de allowlists
  - H2: Caminhos de canais de mensagem compatíveis
  - H2: Diagnósticos de Plugin
  - H2: Públicos de canais do Discord
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
  - H2: Relacionado

## channels/bot-loop-protection.md

- Rota: /channels/bot-loop-protection
- Títulos:
  - H1: Proteção contra loop de bot
  - H2: Padrões
  - H2: Configurar padrões compartilhados
  - H2: Substituir por canal ou conta
  - H2: Compatibilidade de canais

## channels/broadcast-groups.md

- Rota: /channels/broadcast-groups
- Títulos:
  - H2: Visão geral
  - H2: Casos de uso
  - H2: Configuração
  - H3: Configuração básica
  - H3: Estratégia de processamento
  - H3: Exemplo completo
  - H2: Como funciona
  - H3: Fluxo de mensagens
  - H3: Isolamento de sessão
  - H3: Exemplo: sessões isoladas
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
  - H2: Melhorias futuras
  - H2: Relacionado

## channels/channel-routing.md

- Rota: /channels/channel-routing
- Títulos:
  - H1: Canais &amp; roteamento
  - H2: Termos-chave
  - H2: Prefixos de alvo de saída
  - H2: Formatos de chave de sessão (exemplos)
  - H2: Fixação da rota principal de DM
  - H2: Gravação de entrada protegida
  - H2: Regras de roteamento (como um agente é escolhido)
  - H2: Grupos de broadcast (executar vários agentes)
  - H2: Visão geral da configuração
  - H2: Armazenamento de sessão
  - H2: Comportamento do WebChat
  - H2: Contexto da resposta
  - H2: Relacionado

## channels/clickclack.md

- Rota: /channels/clickclack
- Títulos:
  - H2: Configuração rápida
  - H2: Vários bots
  - H2: Alvos
  - H2: Permissões
  - H2: Solução de problemas

## channels/discord.md

- Rota: /channels/discord
- Títulos:
  - H2: Configuração rápida
  - H2: Recomendado: configure um espaço de trabalho de guilda
  - H2: Modelo de runtime
  - H2: Canais de fórum
  - H2: Componentes interativos
  - H2: Controle de acesso e roteamento
  - H3: Roteamento de agentes baseado em função
  - H2: Comandos nativos e autenticação de comandos
  - H2: Detalhes dos recursos
  - H2: Ferramentas e controles de ação
  - H2: UI de Components v2
  - H2: Voz
  - H3: Canais de voz
  - H3: Seguir usuários em voz
  - H3: Mensagens de voz
  - H2: Solução de problemas
  - H2: Referência de configuração
  - H2: Segurança e operações
  - H2: Relacionado

## channels/feishu.md

- Rota: /channels/feishu
- Títulos:
  - H2: Início rápido
  - H2: Controle de acesso
  - H3: Mensagens diretas
  - H3: Chats em grupo
  - H2: Exemplos de configuração de grupo
  - H3: Permitir todos os grupos, sem exigir @menção
  - H3: Permitir todos os grupos, ainda exigir @menção
  - H3: Permitir apenas grupos específicos
  - H3: Restringir remetentes dentro de um grupo
  - H2: Obter IDs de grupo/usuário
  - H3: IDs de grupo (chatid, formato: ocxxx)
  - H3: IDs de usuário (openid, formato: ouxxx)
  - H2: Comandos comuns
  - H2: Solução de problemas
  - H3: Bot não responde em chats em grupo
  - H3: Bot não recebe mensagens
  - H3: A configuração por QR não reage no app móvel do Feishu
  - H3: App Secret vazado
  - H2: Configuração avançada
  - H3: Várias contas
  - H3: Limites de mensagens
  - H3: Streaming
  - H3: Otimização de cota
  - H3: Sessões ACP
  - H4: Vinculação ACP persistente
  - H4: Gerar ACP a partir do chat
  - H3: Roteamento multiagente
  - H2: Isolamento de agente por usuário (criação dinâmica de agentes)
  - H3: Configuração rápida
  - H3: Como funciona
  - H3: Opções de configuração
  - H3: Escopo da sessão
  - H3: Implantação multiusuário típica
  - H3: Verificação
  - H3: Notas
  - H2: Referência de configuração
  - H2: Tipos de mensagem compatíveis
  - H3: Receber
  - H3: Enviar
  - H3: Threads e respostas
  - H2: Relacionado

## channels/googlechat.md

- Rota: /channels/googlechat
- Títulos:
  - H2: Instalar
  - H2: Configuração rápida (iniciante)
  - H2: Adicionar ao Google Chat
  - H2: URL pública (somente Webhook)
  - H3: Opção A: Tailscale Funnel (Recomendado)
  - H3: Opção B: Proxy reverso (Caddy)
  - H3: Opção C: Cloudflare Tunnel
  - H2: Como funciona
  - H2: Alvos
  - H2: Destaques da configuração
  - H2: Solução de problemas
  - H3: 405 Method Not Allowed
  - H3: Outros problemas
  - H2: Relacionado

## channels/group-messages.md

- Rota: /channels/group-messages
- Títulos:
  - H2: Comportamento
  - H2: Exemplo de configuração (WhatsApp)
  - H3: Comando de ativação (somente proprietário)
  - H2: Como usar
  - H2: Teste / verificação
  - H2: Considerações conhecidas
  - H2: Relacionado

## channels/groups.md

- Rota: /channels/groups
- Títulos:
  - H2: Introdução para iniciantes (2 minutos)
  - H2: Respostas visíveis
  - H2: Visibilidade do contexto e allowlists
  - H2: Chaves de sessão
  - H2: Padrão: DMs pessoais + grupos públicos (agente único)
  - H2: Rótulos de exibição
  - H2: Política de grupo
  - H2: Controle por menção (padrão)
  - H2: Escopo de padrões de menção configurados
  - H2: Restrições de ferramentas por grupo/canal (opcional)
  - H2: Allowlists de grupos
  - H2: Ativação (somente proprietário)
  - H2: Campos de contexto
  - H2: Especificidades do iMessage
  - H2: Prompts de sistema do WhatsApp
  - H2: Especificidades do WhatsApp
  - H2: Relacionado

## channels/imessage-from-bluebubbles.md

- Rota: /channels/imessage-from-bluebubbles
- Títulos:
  - H2: Checklist de migração
  - H2: Quando esta migração faz sentido
  - H2: O que o imsg faz
  - H2: Antes de começar
  - H2: Tradução de configuração
  - H2: Armadilha do registro de grupos
  - H2: Passo a passo
  - H2: Paridade de ações em resumo
  - H2: Pareamento, sessões e vinculações ACP
  - H2: Sem canal de rollback
  - H2: Relacionado

## channels/imessage.md

- Rota: /channels/imessage
- Títulos:
  - H2: Configuração rápida
  - H2: Requisitos e permissões (macOS)
  - H2: Habilitando a API privada do imsg
  - H3: Configuração
  - H3: Quando você não pode desabilitar o SIP
  - H2: Controle de acesso e roteamento
  - H2: Vinculações de conversa ACP
  - H2: Padrões de implantação
  - H2: Mídia, fragmentação e alvos de entrega
  - H2: Ações da API privada
  - H2: Gravações de configuração
  - H2: Mesclagem de DMs enviadas separadamente (comando + URL em uma composição)
  - H3: Cenários e o que o agente vê
  - H2: Recuperação de entrada após reinício de uma ponte ou Gateway
  - H3: Sinal visível para o operador
  - H3: Migração
  - H2: Solução de problemas
  - H2: Ponteiros da referência de configuração
  - H2: Relacionado

## channels/index.md

- Rota: /channels
- Títulos:
  - H2: Notas de entrega
  - H2: Canais compatíveis
  - H2: Notas

## channels/irc.md

- Rota: /channels/irc
- Títulos:
  - H2: Início rápido
  - H2: Padrões de segurança
  - H2: Controle de acesso
  - H3: Pegadinha comum: allowFrom é para DMs, não canais
  - H2: Acionamento de resposta (menções)
  - H2: Nota de segurança (recomendado para canais públicos)
  - H3: Mesmas ferramentas para todos no canal
  - H3: Ferramentas diferentes por remetente (proprietário recebe mais poder)
  - H2: NickServ
  - H2: Variáveis de ambiente
  - H2: Solução de problemas
  - H2: Relacionado

## channels/line.md

- Rota: /channels/line
- Títulos:
  - H2: Instalar
  - H2: Configurar
  - H2: Configurar
  - H2: Controle de acesso
  - H2: Comportamento das mensagens
  - H2: Dados do canal (mensagens ricas)
  - H2: Suporte a ACP
  - H2: Mídia de saída
  - H2: Solução de problemas
  - H2: Relacionados

## channels/location.md

- Rota: /channels/location
- Títulos:
  - H2: Formatação de texto
  - H2: Campos de contexto
  - H2: Observações do canal
  - H2: Relacionados

## channels/matrix-migration.md

- Rota: /channels/matrix-migration
- Títulos:
  - H2: O que a migração faz automaticamente
  - H2: O que a migração não consegue fazer automaticamente
  - H2: Fluxo de atualização recomendado
  - H2: Como a migração criptografada funciona
  - H2: Mensagens comuns e o que elas significam
  - H3: Mensagens de atualização e detecção
  - H3: Mensagens de recuperação de estado criptografado
  - H3: Mensagens de recuperação manual
  - H3: Mensagens de instalação de Plugin personalizado
  - H2: Se o histórico criptografado ainda não voltar
  - H2: Se você quiser começar do zero para mensagens futuras
  - H2: Relacionados

## channels/matrix-presentation.md

- Rota: /channels/matrix-presentation
- Títulos:
  - H2: Conteúdo do evento
  - H2: Comportamento de fallback
  - H2: Blocos compatíveis
  - H2: Interações
  - H2: Relação com metadados de aprovação
  - H2: Mensagens de mídia

## channels/matrix-push-rules.md

- Rota: /channels/matrix-push-rules
- Títulos:
  - H2: Pré-requisitos
  - H2: Etapas
  - H2: Observações sobre vários bots
  - H2: Observações sobre homeserver
  - H2: Relacionados

## channels/matrix.md

- Rota: /channels/matrix
- Títulos:
  - H2: Instalar
  - H2: Configurar
  - H3: Configuração interativa
  - H3: Configuração mínima
  - H3: Entrada automática
  - H3: Formatos de destino da lista de permissões
  - H3: Normalização de ID da conta
  - H3: Credenciais em cache
  - H3: Variáveis de ambiente
  - H2: Exemplo de configuração
  - H2: Pré-visualizações em streaming
  - H2: Mensagens de voz
  - H2: Metadados de aprovação
  - H3: Regras de push auto-hospedadas para pré-visualizações finalizadas discretas
  - H2: Salas bot a bot
  - H2: Criptografia e verificação
  - H3: Ativar criptografia
  - H3: Sinais de status e confiança
  - H3: Verificar este dispositivo com uma chave de recuperação
  - H3: Inicializar ou reparar assinatura cruzada
  - H3: Backup de chaves da sala
  - H3: Listar, solicitar e responder a verificações
  - H3: Observações sobre várias contas
  - H2: Gerenciamento de perfil
  - H2: Threads
  - H3: Roteamento de sessão (sessionScope)
  - H3: Respostas em thread (threadReplies)
  - H3: Herança de thread e comandos de barra
  - H2: Vinculações de conversa ACP
  - H3: Configuração de vinculação de thread
  - H2: Reações
  - H2: Contexto do histórico
  - H2: Visibilidade do contexto
  - H2: Política de DM e sala
  - H2: Reparo de sala direta
  - H2: Aprovações de execução
  - H2: Comandos de barra
  - H2: Várias contas
  - H2: Homeservers privados/LAN
  - H2: Proxy do tráfego Matrix
  - H2: Resolução de destino
  - H2: Referência de configuração
  - H3: Conta e conexão
  - H3: Criptografia
  - H3: Acesso e política
  - H3: Comportamento de resposta
  - H3: Configurações de reação
  - H3: Ferramentas e substituições por sala
  - H3: Configurações de aprovação de execução
  - H2: Relacionados

## channels/mattermost.md

- Rota: /channels/mattermost
- Títulos:
  - H2: Instalar
  - H2: Configuração rápida
  - H2: Comandos de barra nativos
  - H2: Variáveis de ambiente (conta padrão)
  - H2: Modos de chat
  - H2: Threads e sessões
  - H2: Controle de acesso (DMs)
  - H2: Canais (grupos)
  - H2: Destinos para entrega de saída
  - H2: Nova tentativa de canal de DM
  - H2: Streaming de pré-visualização
  - H2: Reações (ferramenta de mensagem)
  - H2: Botões interativos (ferramenta de mensagem)
  - H3: Integração direta de API (scripts externos)
  - H2: Adaptador de diretório
  - H2: Várias contas
  - H2: Solução de problemas
  - H2: Relacionados

## channels/msteams.md

- Rota: /channels/msteams
- Títulos:
  - H2: Plugin incluído
  - H2: Configuração rápida
  - H2: Objetivos
  - H2: Gravações de configuração
  - H2: Controle de acesso (DMs + grupos)
  - H3: Como funciona
  - H3: Etapa 1: Criar Azure Bot
  - H3: Etapa 2: Obter credenciais
  - H3: Etapa 3: Configurar endpoint de mensagens
  - H3: Etapa 4: Ativar canal Teams
  - H3: Etapa 5: Criar manifesto do app Teams
  - H3: Etapa 6: Configurar OpenClaw
  - H3: Etapa 7: Executar o Gateway
  - H2: Autenticação federada (certificado mais identidade gerenciada)
  - H3: Opção A: Autenticação baseada em certificado
  - H3: Opção B: Azure Managed Identity
  - H3: Configuração de AKS Workload Identity
  - H3: Comparação de tipos de autenticação
  - H2: Desenvolvimento local (tunelamento)
  - H2: Testar o bot
  - H2: Variáveis de ambiente
  - H2: Ação de informações do membro
  - H2: Contexto do histórico
  - H2: Permissões RSC atuais do Teams (manifesto)
  - H2: Exemplo de manifesto Teams (redigido)
  - H3: Ressalvas do manifesto (campos obrigatórios)
  - H3: Atualizar um app existente
  - H2: Capacidades: somente RSC vs Graph
  - H3: Somente com RSC do Teams (app instalado, sem permissões de API Graph)
  - H3: Com RSC do Teams + permissões de aplicativo do Microsoft Graph
  - H3: RSC vs API Graph
  - H2: Mídia + histórico habilitados para Graph (obrigatório para canais)
  - H2: Limitações conhecidas
  - H3: Timeouts de Webhook
  - H3: Suporte à nuvem Teams e URL de serviço
  - H3: Formatação
  - H2: Configuração
  - H2: Roteamento e sessões
  - H2: Estilo de resposta: threads vs posts
  - H3: Precedência de resolução
  - H3: Preservação de contexto da thread
  - H2: Anexos e imagens
  - H2: Envio de arquivos em chats em grupo
  - H3: Por que chats em grupo precisam do SharePoint
  - H3: Configuração
  - H3: Comportamento de compartilhamento
  - H3: Comportamento de fallback
  - H3: Local dos arquivos armazenados
  - H2: Enquetes (Adaptive Cards)
  - H2: Cartões de apresentação
  - H2: Formatos de destino
  - H2: Mensagens proativas
  - H2: IDs de equipe e canal (pegadinha comum)
  - H2: Canais privados
  - H2: Solução de problemas
  - H3: Problemas comuns
  - H3: Erros de upload do manifesto
  - H3: Permissões RSC não funcionam
  - H2: Referências
  - H2: Relacionados

## channels/nextcloud-talk.md

- Rota: /channels/nextcloud-talk
- Títulos:
  - H2: Plugin incluído
  - H2: Configuração rápida (iniciante)
  - H2: Observações
  - H2: Controle de acesso (DMs)
  - H2: Salas (grupos)
  - H2: Capacidades
  - H2: Referência de configuração (Nextcloud Talk)
  - H2: Relacionados

## channels/nostr.md

- Rota: /channels/nostr
- Títulos:
  - H2: Plugin incluído
  - H3: Instalações antigas/personalizadas
  - H3: Configuração não interativa
  - H2: Configuração rápida
  - H2: Referência de configuração
  - H2: Metadados de perfil
  - H2: Controle de acesso
  - H3: Políticas de DM
  - H3: Exemplo de lista de permissões
  - H2: Formatos de chave
  - H2: Relays
  - H2: Suporte ao protocolo
  - H2: Testes
  - H3: Relay local
  - H3: Teste manual
  - H2: Solução de problemas
  - H3: Não está recebendo mensagens
  - H3: Não está enviando respostas
  - H3: Respostas duplicadas
  - H2: Segurança
  - H2: Limitações (MVP)
  - H2: Relacionados

## channels/pairing.md

- Rota: /channels/pairing
- Títulos:
  - H2: 1) Pareamento por DM (acesso de chat de entrada)
  - H3: Aprovar um remetente
  - H3: Grupos de remetentes reutilizáveis
  - H3: Onde o estado fica armazenado
  - H2: 2) Pareamento de dispositivo Node (nós iOS/Android/macOS/headless)
  - H3: Parear via Telegram (recomendado para iOS)
  - H3: Aprovar um dispositivo Node
  - H3: Aprovação automática opcional de Node por CIDR confiável
  - H3: Armazenamento de estado de pareamento de Node
  - H3: Observações
  - H2: Documentação relacionada

## channels/qa-channel.md

- Rota: /channels/qa-channel
- Títulos:
  - H2: O que ele faz
  - H2: Configuração
  - H2: Runners
  - H2: Relacionados

## channels/qqbot.md

- Rota: /channels/qqbot
- Títulos:
  - H2: Instalar
  - H2: Configurar
  - H2: Configurar
  - H3: Configuração de várias contas
  - H3: Chats em grupo
  - H3: Voz (STT / TTS)
  - H2: Formatos de destino
  - H2: Comandos de barra
  - H2: Arquitetura do mecanismo
  - H2: Integração por QR code
  - H2: Solução de problemas
  - H2: Relacionados

## channels/raft.md

- Rota: /channels/raft
- Títulos:
  - H2: Instalar
  - H2: Pré-requisitos
  - H2: Configurar
  - H2: Como funciona
  - H2: Verificar
  - H2: Solução de problemas
  - H2: Referências

## channels/signal.md

- Rota: /channels/signal
- Títulos:
  - H2: Pré-requisitos
  - H2: Configuração rápida (iniciante)
  - H2: O que é
  - H2: Gravações de configuração
  - H2: O modelo de número (importante)
  - H2: Caminho de configuração A: vincular conta Signal existente (QR)
  - H2: Caminho de configuração B: registrar número de bot dedicado (SMS, Linux)
  - H2: Modo de daemon externo (httpUrl)
  - H2: Modo contêiner (bbernhard/signal-cli-rest-api)
  - H2: Controle de acesso (DMs + grupos)
  - H2: Como funciona (comportamento)
  - H2: Mídia + limites
  - H2: Digitação + confirmações de leitura
  - H2: Reações de status do ciclo de vida
  - H2: Reações (ferramenta de mensagem)
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
  - H2: Escolher Socket Mode ou URLs de solicitação HTTP
  - H3: Modo relay
  - H2: Instalar
  - H2: Configuração rápida
  - H2: Ajuste de transporte do Socket Mode
  - H2: Checklist de manifesto e escopos
  - H3: Configurações adicionais do manifesto
  - H2: Modelo de token
  - H2: Ações e gates
  - H2: Controle de acesso e roteamento
  - H2: Threads, sessões e tags de resposta
  - H2: Reações de confirmação
  - H3: Emoji (ackReaction)
  - H3: Escopo (messages.ackReactionScope)
  - H2: Streaming de texto
  - H2: Fallback de reação de digitação
  - H2: Mídia, fragmentação e entrega
  - H2: Comandos e comportamento de barra
  - H2: Respostas interativas
  - H3: Envios de modal pertencentes ao Plugin
  - H2: Aprovações nativas no Slack
  - H2: Eventos e comportamento operacional
  - H2: Referência de configuração
  - H2: Solução de problemas
  - H2: Referência de visão de anexos
  - H3: Tipos de mídia compatíveis
  - H3: Pipeline de entrada
  - H3: Herança de anexos da raiz da thread
  - H3: Tratamento de múltiplos anexos
  - H3: Tamanho, download e limites do modelo
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
  - H3: Número privado somente com lista de permissões
  - H3: Remetente do Messaging Service
  - H3: Destino de saída padrão
  - H2: Controle de acesso
  - H2: Enviar SMS
  - H2: Verificar configuração
  - H3: Teste de ponta a ponta a partir do macOS iMessage/SMS
  - H2: Segurança de Webhook
  - H2: Configuração de várias contas
  - H2: Solução de problemas
  - H3: Twilio retorna 403 ou OpenClaw rejeita o Webhook
  - H3: Nenhuma solicitação de pareamento aparece
  - H3: Envios de saída falham
  - H3: Mensagens chegam, mas o agente não responde

## channels/synology-chat.md

- Rota: /channels/synology-chat
- Títulos:
  - H2: Plugin incluído
  - H2: Configuração rápida
  - H2: Variáveis de ambiente
  - H2: Política de DM e controle de acesso
  - H2: Entrega de saída
  - H2: Várias contas
  - H2: Observações de segurança
  - H2: Solução de problemas
  - H2: Relacionados

## channels/telegram.md

- Rota: /channels/telegram
- Títulos:
  - H2: Configuração rápida
  - H2: Configurações no lado do Telegram
  - H2: Controle de acesso e ativação
  - H3: Identidade do bot em grupo
  - H2: Comportamento em tempo de execução
  - H2: Referência de recursos
  - H2: Controles de resposta de erro
  - H2: Solução de problemas
  - H2: Referência de configuração
  - H2: Relacionados

## channels/tlon.md

- Rota: /channels/tlon
- Títulos:
  - H2: Plugin incluído
  - H2: Configurar
  - H2: Naves privadas/LAN
  - H2: Canais de grupo
  - H2: Controle de acesso
  - H2: Sistema de proprietário e aprovação
  - H2: Configurações de aceite automático
  - H2: Destinos de entrega (CLI/cron)
  - H2: Skill incluída
  - H2: Capacidades
  - H2: Solução de problemas
  - H2: Referência de configuração
  - H2: Observações
  - H2: Relacionados

## channels/troubleshooting.md

- Rota: /channels/troubleshooting
- Títulos:
  - H2: Escada de comandos
  - H2: Após uma atualização
  - H2: WhatsApp
  - H3: Assinaturas de falha do WhatsApp
  - H2: Telegram
  - H3: Assinaturas de falha do Telegram
  - H2: Discord
  - H3: Assinaturas de falha do Discord
  - H2: Slack
  - H3: Assinaturas de falha do Slack
  - H2: iMessage
  - H3: Assinaturas de falha do iMessage
  - H2: Signal
  - H3: Assinaturas de falha do Signal
  - H2: QQ Bot
  - H3: Assinaturas de falha do QQ Bot
  - H2: Matrix
  - H3: Assinaturas de falha do Matrix
  - H2: Relacionados

## channels/twitch.md

- Rota: /channels/twitch
- Títulos:
  - H2: Plugin integrado
  - H2: Configuração rápida (iniciante)
  - H2: O que é
  - H2: Configuração (detalhada)
  - H3: Gerar credenciais
  - H3: Configurar o bot
  - H3: Controle de acesso (recomendado)
  - H2: Atualização de token (opcional)
  - H2: Suporte a múltiplas contas
  - H2: Controle de acesso
  - H2: Solução de problemas
  - H2: Configuração
  - H3: Configuração da conta
  - H3: Opções de provedor
  - H2: Ações de ferramenta
  - H2: Segurança e operações
  - H2: Limites
  - H2: Relacionados

## channels/wechat.md

- Rota: /channels/wechat
- Títulos:
  - H2: Nomenclatura
  - H2: Como funciona
  - H2: Instalação
  - H2: Login
  - H2: Controle de acesso
  - H2: Compatibilidade
  - H2: Processo sidecar
  - H2: Solução de problemas
  - H2: Documentos relacionados

## channels/whatsapp.md

- Rota: /channels/whatsapp
- Títulos:
  - H2: Instalação (sob demanda)
  - H2: Configuração rápida
  - H2: Padrões de implantação
  - H2: Modelo de runtime
  - H2: Prompts de aprovação
  - H2: Hooks de Plugin e privacidade
  - H2: Controle de acesso e ativação
  - H2: Bindings ACP configurados
  - H2: Comportamento de número pessoal e chat consigo mesmo
  - H2: Normalização de mensagens e contexto
  - H2: Entrega, divisão em partes e mídia
  - H2: Citação de respostas
  - H2: Nível de reação
  - H2: Reações de confirmação
  - H2: Reações de status do ciclo de vida
  - H2: Múltiplas contas e credenciais
  - H2: Ferramentas, ações e gravações de configuração
  - H2: Solução de problemas
  - H2: Prompts do sistema
  - H2: Ponteiros de referência de configuração
  - H2: Relacionados

## channels/yuanbao.md

- Rota: /channels/yuanbao
- Títulos:
  - H2: Início rápido
  - H3: Configuração interativa (alternativa)
  - H2: Controle de acesso
  - H3: Mensagens diretas
  - H3: Chats em grupo
  - H2: Exemplos de configuração
  - H3: Configuração básica com política aberta de DM
  - H3: Restringir DMs a usuários específicos
  - H3: Desabilitar requisito de @menção em grupos
  - H3: Otimizar a entrega de mensagens de saída
  - H3: Ajustar a estratégia merge-text
  - H2: Comandos comuns
  - H2: Solução de problemas
  - H3: O bot não responde em chats em grupo
  - H3: O bot não recebe mensagens
  - H3: O bot envia respostas vazias ou de fallback
  - H3: App Secret vazado
  - H2: Configuração avançada
  - H3: Múltiplas contas
  - H3: Limites de mensagens
  - H3: Streaming
  - H3: Contexto do histórico de chat em grupo
  - H3: Modo responder a
  - H3: Injeção de dica de Markdown
  - H3: Modo de depuração
  - H3: Roteamento multiagente
  - H2: Referência de configuração
  - H2: Tipos de mensagem compatíveis
  - H3: Receber
  - H3: Enviar
  - H3: Threads e respostas
  - H2: Relacionados

## channels/zalo.md

- Rota: /channels/zalo
- Títulos:
  - H2: Plugin integrado
  - H2: Configuração rápida (iniciante)
  - H2: O que é
  - H2: Configuração (caminho rápido)
  - H3: 1) Criar um token de bot (Zalo Bot Platform)
  - H3: 2) Configurar o token (env ou config)
  - H2: Como funciona (comportamento)
  - H2: Limites
  - H2: Controle de acesso (DMs)
  - H3: Acesso a DM
  - H2: Controle de acesso (grupos)
  - H2: Long-polling vs webhook
  - H2: Tipos de mensagem compatíveis
  - H2: Capacidades
  - H2: Destinos de entrega (CLI/cron)
  - H2: Solução de problemas
  - H2: Referência de configuração (Zalo)
  - H2: Relacionados

## channels/zaloclawbot.md

- Rota: /channels/zaloclawbot
- Títulos:
  - H2: Compatibilidade
  - H2: Pré-requisitos
  - H2: Instalar com onboard (recomendado)
  - H2: Instalação manual
  - H3: 1. Instalar o plugin
  - H3: 2. Habilitar o plugin na configuração
  - H3: 3. Gerar código QR e fazer login
  - H3: 4. Reiniciar o Gateway
  - H2: Como funciona
  - H2: Por baixo dos panos
  - H2: Solução de problemas

## channels/zalouser.md

- Rota: /channels/zalouser
- Títulos:
  - H2: Plugin integrado
  - H2: Configuração rápida (iniciante)
  - H2: O que é
  - H2: Nomenclatura
  - H2: Encontrar IDs (diretório)
  - H2: Limites
  - H2: Controle de acesso (DMs)
  - H2: Acesso a grupos (opcional)
  - H3: Bloqueio por menção em grupo
  - H2: Múltiplas contas
  - H2: Variáveis de ambiente
  - H2: Digitação, reações e confirmações de entrega
  - H2: Solução de problemas
  - H2: Relacionados

## ci.md

- Rota: /ci
- Títulos:
  - H2: Visão geral do pipeline
  - H2: Ordem de falha rápida
  - H2: Contexto e evidência de PR
  - H2: Escopo e roteamento
  - H2: Encaminhamento de atividade do ClawSweeper
  - H2: Disparos manuais
  - H2: Runners
  - H2: Orçamento de registro de runner
  - H2: Equivalentes locais
  - H2: Desempenho do OpenClaw
  - H2: Validação completa de release
  - H2: Shards live e E2E
  - H2: Aceitação de pacote
  - H3: Jobs
  - H3: Fontes candidatas
  - H3: Perfis de suíte
  - H3: Janelas de compatibilidade legada
  - H3: Exemplos
  - H2: Smoke de instalação
  - H2: E2E local com Docker
  - H3: Ajustáveis
  - H3: Workflow live/E2E reutilizável
  - H3: Partes do caminho de release
  - H2: Pré-release de Plugin
  - H2: Laboratório de QA
  - H2: CodeQL
  - H3: Categorias de segurança
  - H3: Shards de segurança específicos da plataforma
  - H3: Categorias de qualidade crítica
  - H2: Workflows de manutenção
  - H3: Agente de Docs
  - H3: Agente de desempenho de testes
  - H3: PRs duplicados após merge
  - H2: Gates de verificação local e roteamento alterado
  - H2: Validação do Testbox
  - H2: Relacionados

## clawhub/cli.md

- Rota: /clawhub/cli
- Títulos:
  - H1: CLI do ClawHub
  - H2: Descobrir e instalar
  - H2: Publicar e manter
  - H2: Relacionados

## clawhub/publishing.md

- Rota: /clawhub/publishing
- Títulos:
  - H1: Publicação no ClawHub
  - H2: Proprietários
  - H2: Skills
  - H2: Plugins
  - H2: Fluxo de release
  - H2: FAQ
  - H3: O escopo do pacote deve corresponder ao proprietário selecionado

## cli/acp.md

- Rota: /cli/acp
- Títulos:
  - H2: O que isto não é
  - H2: Matriz de compatibilidade
  - H2: Limitações conhecidas
  - H2: Uso
  - H2: Cliente ACP (depuração)
  - H2: Teste smoke de protocolo
  - H2: Como usar isto
  - H2: Seleção de agentes
  - H2: Usar a partir de acpx (Codex, Claude, outros clientes ACP)
  - H2: Configuração do editor Zed
  - H2: Mapeamento de sessão
  - H2: Opções
  - H3: Opções do cliente acp
  - H2: Relacionados

## cli/agent.md

- Rota: /cli/agent
- Títulos:
  - H1: openclaw agent
  - H2: Opções
  - H2: Exemplos
  - H2: Observações
  - H2: Status de entrega JSON
  - H2: Relacionados

## cli/agents.md

- Rota: /cli/agents
- Títulos:
  - H1: openclaw agents
  - H2: Exemplos
  - H2: Bindings de roteamento
  - H3: Formato --bind
  - H3: Comportamento de escopo de binding
  - H2: Superfície de comandos
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: Arquivos de identidade
  - H2: Definir identidade
  - H2: Relacionados

## cli/approvals.md

- Rota: /cli/approvals
- Títulos:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Comandos comuns
  - H2: Substituir aprovações de um arquivo
  - H2: Exemplo "Nunca pedir confirmação" / YOLO
  - H2: Helpers de lista de permissões
  - H2: Opções comuns
  - H2: Observações
  - H2: Relacionados

## cli/attach.md

- Rota: /cli/attach
- Títulos: nenhum

## cli/backup.md

- Rota: /cli/backup
- Títulos:
  - H1: openclaw backup
  - H2: Observações
  - H2: O que recebe backup
  - H2: Comportamento de configuração inválida
  - H2: Tamanho e desempenho
  - H2: Relacionados

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
  - H2: Controle remoto do navegador (proxy de host node)
  - H2: Relacionados

## cli/channels.md

- Rota: /cli/channels
- Títulos:
  - H1: openclaw channels
  - H2: Comandos comuns
  - H2: Status / capacidades / resolver / logs
  - H2: Adicionar / remover contas
  - H2: Login e logout (interativo)
  - H2: Solução de problemas
  - H2: Sondagem de capacidades
  - H2: Resolver nomes para IDs
  - H2: Relacionados

## cli/clawbot.md

- Rota: /cli/clawbot
- Títulos:
  - H1: openclaw clawbot
  - H2: Migração
  - H2: Relacionados

## cli/commitments.md

- Rota: /cli/commitments
- Títulos:
  - H2: Uso
  - H2: Opções
  - H2: Exemplos
  - H2: Saída
  - H2: Relacionados

## cli/completion.md

- Rota: /cli/completion
- Títulos:
  - H1: openclaw completion
  - H2: Uso
  - H2: Opções
  - H2: Observações
  - H2: Relacionados

## cli/config.md

- Rota: /cli/config
- Títulos:
  - H2: Opções raiz
  - H2: Exemplos
  - H3: Esquema de config
  - H3: Caminhos
  - H2: Valores
  - H2: Modos de config set
  - H2: config patch
  - H2: Flags do construtor de provedor
  - H2: Simulação
  - H3: Formato da saída JSON
  - H2: Segurança de gravação
  - H2: Subcomandos
  - H2: Validar
  - H2: Relacionados

## cli/configure.md

- Rota: /cli/configure
- Títulos:
  - H1: openclaw configure
  - H2: Opções
  - H2: Exemplos
  - H2: Relacionados

## cli/crestodian.md

- Rota: /cli/crestodian
- Títulos:
  - H1: openclaw crestodian
  - H2: O que o Crestodian mostra
  - H2: Exemplos
  - H2: Inicialização segura
  - H2: Operações e aprovação
  - H2: Bootstrap de configuração
  - H2: Planejador assistido por modelo
  - H2: Alternar para um agente
  - H2: Modo de resgate de mensagens
  - H2: Relacionados

## cli/cron.md

- Rota: /cli/cron
- Títulos:
  - H1: openclaw cron
  - H2: Criar jobs rapidamente
  - H2: Sessões
  - H2: Entrega
  - H3: Propriedade de entrega
  - H3: Entrega de falhas
  - H2: Agendamento
  - H3: Jobs de execução única
  - H3: Jobs recorrentes
  - H3: Execuções manuais
  - H2: Modelos
  - H3: Precedência do modelo Cron isolado
  - H3: Modo rápido
  - H3: Novas tentativas de troca de modelo live
  - H2: Saída da execução e negações
  - H3: Supressão de confirmação obsoleta
  - H3: Supressão silenciosa de token
  - H3: Negações estruturadas
  - H2: Retenção
  - H2: Migração de jobs mais antigos
  - H2: Edições comuns
  - H2: Comandos administrativos comuns
  - H2: Relacionados

## cli/daemon.md

- Rota: /cli/daemon
- Títulos:
  - H1: openclaw daemon
  - H2: Uso
  - H2: Subcomandos
  - H2: Opções comuns
  - H2: Preferir
  - H2: Relacionados

## cli/dashboard.md

- Rota: /cli/dashboard
- Títulos:
  - H1: openclaw dashboard
  - H2: Relacionados

## cli/devices.md

- Rota: /cli/devices
- Títulos:
  - H1: openclaw devices
  - H2: Comandos
  - H3: openclaw devices list
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Aprovação de primeira execução do Paperclip / openclawgateway
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Opções comuns
  - H2: Observações
  - H2: Checklist de recuperação de desvio de token
  - H2: Relacionados

## cli/directory.md

- Rota: /cli/directory
- Títulos:
  - H1: openclaw directory
  - H2: Flags comuns
  - H2: Observações
  - H2: Usar resultados com envio de mensagem
  - H2: Formatos de ID (por canal)
  - H2: Eu ("me")
  - H2: Pares (contatos/usuários)
  - H2: Grupos
  - H2: Relacionados

## cli/dns.md

- Rota: /cli/dns
- Títulos:
  - H1: openclaw dns
  - H2: Configuração
  - H2: dns setup
  - H2: Relacionados

## cli/docs.md

- Rota: /cli/docs
- Títulos:
  - H1: openclaw docs
  - H2: Uso
  - H2: Exemplos
  - H2: Como funciona
  - H2: Saída
  - H2: Códigos de saída
  - H2: Relacionados

## cli/doctor.md

- Rota: /cli/doctor
- Títulos:
  - H1: openclaw doctor
  - H2: Por que usar
  - H2: Exemplos
  - H2: Opções
  - H2: Modo lint
  - H2: Verificações estruturadas de integridade
  - H2: Seleção de verificações
  - H2: Modo pós-upgrade
  - H2: macOS: substituições de env do launchctl
  - H2: Relacionados

## cli/flows.md

- Rota: /cli/flows
- Títulos:
  - H1: openclaw tasks flow
  - H2: Subcomandos
  - H3: Valores de filtro de status
  - H2: Exemplos
  - H2: Relacionados

## cli/gateway.md

- Rota: /cli/gateway
- Títulos:
  - H2: Executar o Gateway
  - H3: Opções
  - H2: Reiniciar o Gateway
  - H3: Perfilamento do Gateway
  - H2: Consultar um Gateway em execução
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Remoto por SSH (paridade com app para Mac)
  - H3: gateway call &lt;method&gt;
  - H2: Gerenciar o serviço do Gateway
  - H3: Instalar com um wrapper
  - H2: Descobrir gateways (Bonjour)
  - H3: gateway discover
  - H2: Relacionados

## cli/health.md

- Rota: /cli/health
- Títulos:
  - H1: openclaw health
  - H2: Opções
  - H2: Relacionados

## cli/hooks.md

- Rota: /cli/hooks
- Títulos:
  - H1: openclaw hooks
  - H2: Listar todos os hooks
  - H2: Obter informações do hook
  - H2: Verificar elegibilidade dos hooks
  - H2: Habilitar um Hook
  - H2: Desabilitar um Hook
  - H2: Observações
  - H2: Instalar pacotes de hooks
  - H2: Atualizar pacotes de hooks
  - H2: Hooks incluídos
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Relacionado

## cli/index.md

- Rota: /cli
- Títulos:
  - H2: Páginas de comandos
  - H2: Flags globais
  - H2: Modos de saída
  - H2: Árvore de comandos
  - H2: Comandos de barra do chat
  - H2: Rastreamento de uso
  - H2: Relacionado

## cli/infer.md

- Rota: /cli/infer
- Títulos:
  - H2: Transformar infer em uma skill
  - H2: Por que usar infer
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
  - H2: Observações
  - H2: Relacionado

## cli/logs.md

- Rota: /cli/logs
- Títulos:
  - H1: openclaw logs
  - H2: Opções
  - H2: Opções RPC compartilhadas do Gateway
  - H2: Exemplos
  - H2: Observações
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
  - H3: Configuração de cliente MCP
  - H3: Opções
  - H3: Segurança e limite de confiança
  - H3: Testes
  - H3: Solução de problemas
  - H2: OpenClaw como registro de cliente MCP
  - H3: Definições salvas de servidor MCP
  - H3: Receitas comuns de servidor
  - H3: Formatos de saída JSON
  - H3: Transporte Stdio
  - H3: Transporte SSE / HTTP
  - H3: Fluxo de trabalho OAuth
  - H3: Transporte HTTP transmitível
  - H2: UI de controle
  - H2: Limites atuais
  - H2: Relacionado

## cli/memory.md

- Rota: /cli/memory
- Títulos:
  - H1: openclaw memory
  - H2: Exemplos
  - H2: Opções
  - H2: Dreaming
  - H2: Relacionado

## cli/message.md

- Rota: /cli/message
- Títulos:
  - H1: openclaw message
  - H2: Uso
  - H2: Flags comuns
  - H2: Comportamento de SecretRef
  - H2: Ações
  - H3: Núcleo
  - H3: Threads
  - H3: Emojis
  - H3: Figurinhas
  - H3: Cargos / Canais / Membros / Voz
  - H3: Eventos
  - H3: Moderação (Discord)
  - H3: Transmissão
  - H2: Exemplos
  - H2: Relacionado

## cli/migrate.md

- Rota: /cli/migrate
- Títulos:
  - H1: openclaw migrate
  - H2: Comandos
  - H2: Modelo de segurança
  - H2: Provedor Claude
  - H3: O que Claude importa
  - H3: Estado de arquivo e revisão manual
  - H2: Provedor Codex
  - H3: O que Codex importa
  - H3: Estado Codex de revisão manual
  - H2: Provedor Hermes
  - H3: O que Hermes importa
  - H3: Chaves .env compatíveis
  - H3: Estado somente de arquivo
  - H3: Após aplicar
  - H2: Contrato de Plugin
  - H2: Integração de onboarding
  - H2: Relacionado

## cli/models.md

- Rota: /cli/models
- Títulos:
  - H1: openclaw models
  - H2: Comandos comuns
  - H3: Varredura de modelos
  - H3: Status dos modelos
  - H2: Aliases + fallbacks
  - H2: Perfis de autenticação
  - H2: Relacionado

## cli/node.md

- Rota: /cli/node
- Títulos:
  - H1: openclaw node
  - H2: Por que usar um host de Node?
  - H2: Proxy de navegador (configuração zero)
  - H2: Executar (primeiro plano)
  - H2: Autenticação do Gateway para host de Node
  - H2: Serviço (segundo plano)
  - H2: Pareamento
  - H2: Aprovações de execução
  - H2: Relacionado

## cli/nodes.md

- Rota: /cli/nodes
- Títulos:
  - H1: openclaw nodes
  - H2: Comandos comuns
  - H2: Invocar
  - H2: Relacionado

## cli/onboard.md

- Rota: /cli/onboard
- Títulos:
  - H1: openclaw onboard
  - H2: Guias relacionados
  - H2: Exemplos
  - H2: Localidade
  - H3: Escolhas não interativas de endpoint Z.AI
  - H2: Flags não interativas adicionais
  - H2: Observações do fluxo
  - H2: Comandos comuns de acompanhamento

## cli/pairing.md

- Rota: /cli/pairing
- Títulos:
  - H1: openclaw pairing
  - H2: Comandos
  - H2: pairing list
  - H2: pairing approve
  - H2: Observações
  - H2: Relacionado

## cli/path.md

- Rota: /cli/path
- Títulos:
  - H1: openclaw path
  - H2: Por que usar
  - H2: Como é usado
  - H2: Como funciona
  - H2: Subcomandos
  - H2: Flags globais
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
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: Códigos de saída
  - H2: Modo de saída
  - H2: Observações
  - H2: Relacionado

## cli/plugins.md

- Rota: /cli/plugins
- Títulos:
  - H2: Comandos
  - H3: Autor
  - H3: Scaffold de provedor
  - H3: Instalar
  - H4: Abreviação do marketplace
  - H3: Listar
  - H3: Índice de Plugin
  - H3: Desinstalar
  - H3: Atualizar
  - H3: Inspecionar
  - H3: Doctor
  - H3: Registro
  - H3: Marketplace
  - H2: Relacionado

## cli/policy.md

- Rota: /cli/policy
- Títulos:
  - H1: openclaw policy
  - H2: Início rápido
  - H3: Referência de regras de política
  - H4: Sobreposições com escopo
  - H4: Canais
  - H4: Servidores MCP
  - H4: Provedores de modelo
  - H4: Rede
  - H4: Ingresso e acesso a canais
  - H4: Gateway
  - H4: Workspace do agente
  - H4: Postura do sandbox
  - H4: Tratamento de dados
  - H4: Segredos
  - H4: Aprovações de execução
  - H4: Perfis de autenticação
  - H4: Metadados de ferramenta
  - H4: Postura de ferramenta
  - H2: Configurar política
  - H2: Aceitar estado da política
  - H2: Achados
  - H2: Reparar
  - H2: Códigos de saída
  - H2: Relacionado

## cli/proxy.md

- Rota: /cli/proxy
- Títulos:
  - H1: openclaw proxy
  - H2: Comandos
  - H2: Validar
  - H2: Predefinições de consulta
  - H2: Observações
  - H2: Relacionado

## cli/qr.md

- Rota: /cli/qr
- Títulos:
  - H1: openclaw qr
  - H2: Uso
  - H2: Opções
  - H2: Observações
  - H2: Relacionado

## cli/reset.md

- Rota: /cli/reset
- Títulos:
  - H1: openclaw reset
  - H2: Relacionado

## cli/sandbox.md

- Rota: /cli/sandbox
- Títulos:
  - H2: Visão geral
  - H2: Comandos
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Casos de uso
  - H3: Após atualizar uma imagem Docker
  - H3: Após alterar a configuração do sandbox
  - H3: Após alterar o destino SSH ou material de autenticação SSH
  - H3: Após alterar a fonte, política ou modo do OpenShell
  - H3: Após alterar setupCommand
  - H3: Somente para um agente específico
  - H2: Por que isso é necessário
  - H2: Migração de registro
  - H2: Configuração
  - H2: Relacionado

## cli/secrets.md

- Rota: /cli/secrets
- Títulos:
  - H1: openclaw secrets
  - H2: Recarregar snapshot de runtime
  - H2: Auditoria
  - H2: Configurar (assistente interativo)
  - H2: Aplicar um plano salvo
  - H2: Por que não há backups de rollback
  - H2: Exemplo
  - H2: Relacionado

## cli/security.md

- Rota: /cli/security
- Títulos:
  - H1: openclaw security
  - H2: Auditoria
  - H2: Saída JSON
  - H2: O que --fix altera
  - H2: Relacionado

## cli/sessions.md

- Rota: /cli/sessions
- Títulos:
  - H1: openclaw sessions
  - H2: Manutenção de limpeza
  - H2: Compactar uma sessão
  - H3: RPC sessions.compact
  - H2: Relacionado

## cli/setup.md

- Rota: /cli/setup
- Títulos:
  - H1: openclaw setup
  - H2: Opções
  - H3: Modo de linha de base
  - H2: Exemplos
  - H2: Observações
  - H2: Relacionado

## cli/skills.md

- Rota: /cli/skills
- Títulos:
  - H1: openclaw skills
  - H2: Comandos
  - H2: Skill Workshop
  - H2: Relacionado

## cli/status.md

- Rota: /cli/status
- Títulos:
  - H2: Relacionado

## cli/system.md

- Rota: /cli/system
- Títulos:
  - H1: openclaw system
  - H2: Comandos comuns
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Observações
  - H2: Relacionado

## cli/tasks.md

- Rota: /cli/tasks
- Títulos:
  - H2: Uso
  - H2: Opções raiz
  - H2: Subcomandos
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Relacionado

## cli/transcripts.md

- Rota: /cli/transcripts
- Títulos:
  - H1: openclaw transcripts
  - H2: Comandos
  - H2: Saída
  - H2: Muitas reuniões por dia
  - H2: Resumos ausentes
  - H2: Configuração

## cli/tui.md

- Rota: /cli/tui
- Títulos:
  - H1: openclaw tui
  - H2: Opções
  - H2: Exemplos
  - H2: Loop de reparo de configuração
  - H2: Relacionado

## cli/uninstall.md

- Rota: /cli/uninstall
- Títulos:
  - H1: openclaw uninstall
  - H2: Relacionado

## cli/update.md

- Rota: /cli/update
- Títulos:
  - H1: openclaw update
  - H2: Uso
  - H2: Opções
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: O que faz
  - H3: Formato da resposta do plano de controle
  - H2: Fluxo de checkout Git
  - H3: Seleção de canal
  - H3: Etapas de atualização
  - H2: Abreviação --update
  - H2: Relacionado

## cli/voicecall.md

- Rota: /cli/voicecall
- Títulos:
  - H1: openclaw voicecall
  - H2: Subcomandos
  - H2: Configuração e smoke
  - H3: setup
  - H3: smoke
  - H2: Ciclo de vida da chamada
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Logs e métricas
  - H3: tail
  - H3: latency
  - H2: Exposição de webhooks
  - H3: expose
  - H2: Relacionado

## cli/webhooks.md

- Rota: /cli/webhooks
- Títulos:
  - H1: openclaw webhooks
  - H2: Subcomandos
  - H2: webhooks gmail setup
  - H3: Obrigatório
  - H3: Opções de Pub/Sub
  - H3: Opções de entrega do OpenClaw
  - H3: Opções de gog watch serve
  - H3: Exposição por Tailscale
  - H3: Saída
  - H2: webhooks gmail run
  - H2: Fluxo de ponta a ponta
  - H2: Relacionado

## cli/wiki.md

- Rota: /cli/wiki
- Títulos:
  - H1: openclaw wiki
  - H2: Para que serve
  - H2: Comandos comuns
  - H2: Comandos
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path-or-url&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Orientação prática de uso
  - H2: Integrações com configuração
  - H2: Relacionado

## cli/workboard.md

- Rota: /cli/workboard
- Títulos:
  - H2: Uso
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Paridade com comando de barra
  - H2: Permissões
  - H2: Solução de problemas
  - H3: Nenhum cartão aparece
  - H3: Dispatch diz somente dados
  - H3: Dispatch não inicia nada
  - H2: Relacionado

## concepts/active-memory.md

- Rota: /concepts/active-memory
- Títulos:
  - H2: Início rápido
  - H2: Recomendações de velocidade
  - H3: Configuração do Cerebras
  - H2: Como ver
  - H2: Alternância de sessão
  - H2: Quando é executado
  - H2: Tipos de sessão
  - H2: Onde é executado
  - H2: Por que usar
  - H2: Como funciona
  - H2: Modos de consulta
  - H2: Estilos de prompt
  - H2: Política de fallback de modelo
  - H2: Ferramentas de memória
  - H3: memory-core integrado
  - H3: Memória LanceDB
  - H3: Lossless Claw
  - H2: Válvulas de escape avançadas
  - H2: Persistência de transcritos
  - H2: Configuração
  - H2: Configuração recomendada
  - H3: Período de tolerância para inicialização a frio
  - H2: Depuração
  - H2: Problemas comuns
  - H2: Páginas relacionadas

## concepts/agent-loop.md

- Rota: /concepts/agent-loop
- Títulos:
  - H2: Pontos de entrada
  - H2: Como funciona (alto nível)
  - H2: Enfileiramento + concorrência
  - H2: Preparação de sessão + workspace
  - H2: Montagem de prompt + prompt do sistema
  - H2: Pontos de hook (onde você pode interceptar)
  - H3: Hooks internos (hooks do Gateway)
  - H3: Hooks de Plugin (ciclo de vida do agente + Gateway)
  - H2: Streaming + respostas parciais
  - H2: Execução de ferramentas + ferramentas de mensagens
  - H2: Formatação da resposta + supressão
  - H2: Compaction + novas tentativas
  - H2: Fluxos de eventos (hoje)
  - H2: Tratamento de canais de chat
  - H2: Timeouts
  - H2: Onde as coisas podem terminar antecipadamente
  - H2: Relacionado

## concepts/agent-runtimes.md

- Rota: /concepts/agent-runtimes
- Títulos:
  - H2: Superfícies do Codex
  - H2: Propriedade do runtime
  - H2: Seleção de runtime
  - H2: Runtime de agente do GitHub Copilot
  - H2: Contrato de compatibilidade
  - H2: Rótulos de status
  - H2: Relacionado

## concepts/agent-workspace.md

- Rota: /concepts/agent-workspace
- Títulos:
  - H2: Local padrão
  - H2: Pastas extras de workspace
  - H2: Mapa de arquivos do workspace
  - H2: O que NÃO está no workspace
  - H2: Backup Git (recomendado, privado)
  - H2: Não faça commit de segredos
  - H2: Movendo o workspace para uma nova máquina
  - H2: Notas avançadas
  - H2: Relacionados

## concepts/agent.md

- Rota: /concepts/agent
- Títulos:
  - H2: Workspace (obrigatório)
  - H2: Arquivos de bootstrap (injetados)
  - H2: Ferramentas integradas
  - H2: Skills
  - H2: Limites de runtime
  - H2: Sessões
  - H2: Direcionamento durante streaming
  - H2: Referências de modelo
  - H2: Configuração (mínima)
  - H2: Relacionados

## concepts/architecture.md

- Rota: /concepts/architecture
- Títulos:
  - H2: Visão geral
  - H2: Componentes e fluxos
  - H3: Gateway (daemon)
  - H3: Clientes (app para Mac / CLI / administração web)
  - H3: Nós (macOS / iOS / Android / headless)
  - H3: WebChat
  - H2: Ciclo de vida da conexão (cliente único)
  - H2: Protocolo de fio (resumo)
  - H2: Pareamento + confiança local
  - H2: Tipagem de protocolo e geração de código
  - H2: Acesso remoto
  - H2: Snapshot operacional
  - H2: Invariantes
  - H2: Relacionados

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
  - H2: Habilitar compromissos
  - H2: Como funciona
  - H2: Escopo
  - H2: Compromissos vs lembretes
  - H2: Gerenciar compromissos
  - H2: Privacidade e custo
  - H2: Solução de problemas
  - H2: Relacionados

## concepts/compaction.md

- Rota: /concepts/compaction
- Títulos:
  - H2: Como funciona
  - H2: Compaction automática
  - H2: Compaction manual
  - H2: Configuração
  - H3: Usando um modelo diferente
  - H3: Preservação de identificadores
  - H3: Proteção de bytes da transcrição ativa
  - H3: Transcrições sucessoras
  - H3: Avisos de Compaction
  - H3: Liberação de memória
  - H2: Provedores de Compaction conectáveis
  - H2: Compaction vs poda
  - H2: Solução de problemas
  - H2: Relacionados

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
  - H3: Configurações de runtime
  - H3: Requisitos do host
  - H3: Isolamento de falhas
  - H3: ownsCompaction
  - H2: Referência de configuração
  - H2: Relação com Compaction e memória
  - H2: Dicas
  - H2: Relacionados

## concepts/context.md

- Rota: /concepts/context
- Títulos:
  - H2: Início rápido (inspecionar contexto)
  - H2: Saída de exemplo
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: O que conta para a janela de contexto
  - H2: Como o OpenClaw cria o prompt do sistema
  - H2: Arquivos de workspace injetados (Contexto do projeto)
  - H2: Skills: injetadas vs carregadas sob demanda
  - H2: Ferramentas: há dois custos
  - H2: Comandos, diretivas e "atalhos inline"
  - H2: Sessões, Compaction e poda (o que persiste)
  - H2: O que /context realmente informa
  - H2: Relacionados

## concepts/delegate-architecture.md

- Rota: /concepts/delegate-architecture
- Títulos:
  - H2: O que é um delegado?
  - H2: Por que delegados?
  - H2: Níveis de capacidade
  - H3: Nível 1: Somente leitura + rascunho
  - H3: Nível 2: Enviar em nome de
  - H3: Nível 3: Proativo
  - H2: Pré-requisitos: isolamento e hardening
  - H3: Bloqueios rígidos (não negociáveis)
  - H3: Restrições de ferramentas
  - H3: Isolamento de sandbox
  - H3: Trilha de auditoria
  - H2: Configurando um delegado
  - H3: 1. Crie o agente delegado
  - H3: 2. Configure a delegação do provedor de identidade
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Vincule o delegado aos canais
  - H3: 4. Adicione credenciais ao agente delegado
  - H2: Exemplo: assistente organizacional
  - H2: Padrão de escalabilidade
  - H2: Relacionados

## concepts/dreaming.md

- Rota: /concepts/dreaming
- Títulos:
  - H2: O que Dreaming escreve
  - H2: Modelo de fases
  - H2: Ingestão de transcrições de sessão
  - H2: Diário de sonhos
  - H2: Sinais de ranqueamento profundo
  - H2: Cobertura do relatório de teste sombra de QA
  - H2: Agendamento
  - H2: Início rápido
  - H2: Comando de barra
  - H2: Fluxo de trabalho da CLI
  - H2: Padrões principais
  - H2: Interface de sonhos
  - H2: Dreaming nunca é executado: status mostra bloqueado
  - H2: Relacionados

## concepts/experimental-features.md

- Rota: /concepts/experimental-features
- Títulos:
  - H2: Flags documentadas atualmente
  - H2: Modo enxuto de modelo local
  - H3: Por que estas três ferramentas
  - H3: Quando ativar
  - H3: Quando deixar desativado
  - H3: Habilitar
  - H2: Experimental não significa oculto
  - H2: Relacionados

## concepts/features.md

- Rota: /concepts/features
- Títulos:
  - H2: Destaques
  - H2: Lista completa
  - H2: Relacionados

## concepts/mantis-slack-desktop-runbook.md

- Rota: /concepts/mantis-slack-desktop-runbook
- Títulos:
  - H2: Modelo de armazenamento
  - H2: Dispatch do GitHub
  - H2: CLI local
  - H2: Modos de hidratação
  - H2: Interpretação de tempo
  - H2: Checklist de evidências
  - H2: Tratamento de falhas
  - H2: Relacionados

## concepts/mantis.md

- Rota: /concepts/mantis
- Títulos:
  - H2: Objetivos
  - H2: Não objetivos
  - H2: Propriedade
  - H2: Formato do comando
  - H2: Ciclo de vida da execução
  - H2: MVP do Discord
  - H2: Peças de QA existentes
  - H2: Modelo de evidências
  - H2: Navegador e VNC
  - H2: Máquinas
  - H2: Segredos
  - H2: Artefatos do GitHub e comentários de PR
  - H2: Notas de implantação privada
  - H2: Adicionando um cenário
  - H2: Expansão de provedores
  - H2: Perguntas em aberto

## concepts/markdown-formatting.md

- Rota: /concepts/markdown-formatting
- Títulos:
  - H2: Objetivos
  - H2: Pipeline
  - H2: Exemplo de IR
  - H2: Onde é usado
  - H2: Tratamento de tabelas
  - H2: Regras de divisão em partes
  - H2: Política de links
  - H2: Spoilers
  - H2: Como adicionar ou atualizar um formatador de canal
  - H2: Pegadinhas comuns
  - H2: Relacionados

## concepts/memory-builtin.md

- Rota: /concepts/memory-builtin
- Títulos:
  - H2: O que fornece
  - H2: Primeiros passos
  - H2: Provedores de embeddings compatíveis
  - H2: Como a indexação funciona
  - H2: Quando usar
  - H2: Solução de problemas
  - H2: Configuração
  - H2: Relacionados

## concepts/memory-honcho.md

- Rota: /concepts/memory-honcho
- Títulos:
  - H2: O que fornece
  - H2: Ferramentas disponíveis
  - H2: Primeiros passos
  - H2: Configuração
  - H2: Migrando memória existente
  - H2: Como funciona
  - H2: Honcho vs memória integrada
  - H2: Comandos da CLI
  - H2: Leitura adicional
  - H2: Relacionados

## concepts/memory-qmd.md

- Rota: /concepts/memory-qmd
- Títulos:
  - H2: O que adiciona em relação ao integrado
  - H2: Primeiros passos
  - H3: Pré-requisitos
  - H3: Habilitar
  - H2: Como o sidecar funciona
  - H2: Desempenho de busca e compatibilidade
  - H2: Substituições de modelo
  - H2: Indexando caminhos extras
  - H2: Indexando transcrições de sessão
  - H2: Escopo da busca
  - H2: Citações
  - H2: Quando usar
  - H2: Solução de problemas
  - H2: Configuração
  - H2: Relacionados

## concepts/memory-search.md

- Rota: /concepts/memory-search
- Títulos:
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H2: Como a busca funciona
  - H2: Melhorando a qualidade da busca
  - H3: Decaimento temporal
  - H3: MMR (diversidade)
  - H3: Habilitar ambos
  - H2: Memória multimodal
  - H2: Busca na memória de sessão
  - H2: Solução de problemas
  - H2: Leitura adicional
  - H2: Relacionados

## concepts/memory.md

- Rota: /concepts/memory
- Títulos:
  - H2: Como funciona
  - H2: O que vai para onde
  - H2: Memórias sensíveis a ações
  - H2: Compromissos inferidos
  - H2: Ferramentas de memória
  - H2: Plugin complementar Memory Wiki
  - H2: Busca de memória
  - H2: Backends de memória
  - H2: Camada de wiki de conhecimento
  - H2: Liberação automática de memória
  - H2: Dreaming
  - H2: Preenchimento fundamentado e promoção ao vivo
  - H2: CLI
  - H2: Leitura adicional
  - H2: Relacionados

## concepts/message-lifecycle-refactor.md

- Rota: /concepts/message-lifecycle-refactor
- Títulos:
  - H2: Problemas
  - H2: Objetivos
  - H2: Não objetivos
  - H2: Modelo de referência
  - H2: Modelo central
  - H2: Termos de mensagem
  - H3: Mensagem
  - H3: Destino
  - H3: Relação
  - H3: Origem
  - H3: Recibo
  - H2: Contexto de recebimento
  - H2: Contexto de envio
  - H2: Contexto ao vivo
  - H2: Superfície do adaptador
  - H2: Redução do SDK público
  - H2: Relação com entrada de canal
  - H2: Barreiras de compatibilidade
  - H2: Armazenamento interno
  - H2: Classes de falha
  - H2: Mapeamento de canal
  - H2: Plano de migração
  - H3: Fase 1: Domínio interno de mensagens
  - H3: Fase 2: Núcleo durável de envio
  - H3: Fase 3: Ponte de entrada de canal
  - H3: Fase 4: Ponte do dispatcher preparado
  - H3: Fase 5: Ciclo de vida ao vivo unificado
  - H3: Fase 6: SDK público
  - H3: Fase 7: Todos os remetentes
  - H3: Fase 8: Remover compatibilidade com nomes de turnos
  - H2: Plano de testes
  - H2: Perguntas em aberto
  - H2: Critérios de aceitação
  - H2: Relacionados

## concepts/messages.md

- Rota: /concepts/messages
- Títulos:
  - H2: Fluxo de mensagens (alto nível)
  - H2: Desduplicação de entrada
  - H2: Debounce de entrada
  - H2: Sessões e dispositivos
  - H2: Metadados de resultado de ferramenta
  - H2: Corpos de entrada e contexto de histórico
  - H2: Enfileiramento e acompanhamentos
  - H2: Propriedade de execução do canal
  - H2: Streaming, divisão em partes e agrupamento
  - H2: Visibilidade de raciocínio e tokens
  - H2: Prefixos, threading e respostas
  - H2: Respostas silenciosas
  - H2: Relacionados

## concepts/model-failover.md

- Rota: /concepts/model-failover
- Títulos:
  - H2: Fluxo de runtime
  - H2: Política de origem de seleção
  - H2: Cache de pular falha de autenticação
  - H2: Avisos de fallback visíveis ao usuário
  - H2: Armazenamento de autenticação (chaves + OAuth)
  - H2: IDs de perfil
  - H2: Ordem de rotação
  - H3: Afinidade de sessão (amigável ao cache)
  - H3: Assinatura OpenAI Codex mais backup por chave de API
  - H2: Cooldowns
  - H2: Desativações de cobrança
  - H2: Fallback de modelo
  - H3: Regras da cadeia de candidatos
  - H3: Quais erros avançam o fallback
  - H3: Pular cooldown vs comportamento de sondagem
  - H2: Substituições de sessão e troca de modelo ao vivo
  - H2: Observabilidade e resumos de falha
  - H2: Configuração relacionada

## concepts/model-providers.md

- Rota: /concepts/model-providers
- Títulos:
  - H2: Regras rápidas
  - H2: Comportamento de provedor pertencente ao Plugin
  - H2: Rotação de chave de API
  - H2: Plugins de provedores oficiais
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Outras opções hospedadas no estilo de assinatura
  - H3: OpenCode
  - H3: Google Gemini (chave de API)
  - H3: Google Vertex e Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Outros plugins de provedores incluídos
  - H4: Peculiaridades que vale conhecer
  - H2: Provedores via models.providers (URL customizada/base)
  - H3: Moonshot AI (Kimi)
  - H3: Codificação Kimi
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (Internacional)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Proxies locais (LM Studio, vLLM, LiteLLM etc.)
  - H2: Exemplos de CLI
  - H2: Relacionados

## concepts/models.md

- Rota: /concepts/models
- Títulos:
  - H2: Como a seleção de modelo funciona
  - H2: Origem de seleção e comportamento de fallback
  - H2: Política rápida de modelos
  - H2: Onboarding (recomendado)
  - H2: Chaves de configuração (visão geral)
  - H3: Edições seguras de allowlist
  - H2: "Modelo não permitido" (e por que as respostas param)
  - H2: Trocando modelos no chat (/model)
  - H2: Comandos da CLI
  - H3: models list
  - H3: models status
  - H2: Varredura (modelos gratuitos do OpenRouter)
  - H2: Registro de modelos (models.json)
  - H2: Relacionados

## concepts/multi-agent.md

- Rota: /concepts/multi-agent
- Títulos:
  - H2: O que é "um agente"?
  - H2: Caminhos (mapa rápido)
  - H3: Modo de agente único (padrão)
  - H2: Auxiliar de agente
  - H2: Início rápido
  - H2: Vários agentes = várias pessoas, várias personalidades
  - H2: Busca de memória QMD entre agentes
  - H2: Um número de WhatsApp, várias pessoas (divisão de DMs)
  - H2: Regras de roteamento (como as mensagens escolhem um agente)
  - H2: Várias contas / números de telefone
  - H2: Conceitos
  - H2: Exemplos de plataforma
  - H2: Padrões comuns
  - H2: Sandbox por agente e configuração de ferramentas
  - H2: Relacionados

## concepts/oauth.md

- Rota: /concepts/oauth
- Títulos:
  - H2: O coletor de tokens (por que ele existe)
  - H2: Armazenamento (onde os tokens ficam)
  - H2: Compatibilidade com token legado da Anthropic
  - H2: Migração da CLI Claude da Anthropic
  - H2: Troca OAuth (como o login funciona)
  - H3: setup-token da Anthropic
  - H3: OpenAI Codex (OAuth do ChatGPT)
  - H2: Atualização + expiração
  - H2: Várias contas (perfis) + roteamento
  - H3: 1) Preferido: agentes separados
  - H3: 2) Avançado: vários perfis em um agente
  - H2: Relacionado

## concepts/parallel-specialist-lanes.md

- Rota: /concepts/parallel-specialist-lanes
- Títulos:
  - H2: Princípios básicos
  - H2: Implantação recomendada
  - H3: Fase 1: contratos de faixa + trabalho pesado em segundo plano
  - H3: Fase 2: controles de prioridade e concorrência
  - H3: Fase 3: coordenador / controlador de tráfego
  - H2: Modelo mínimo de contrato de faixa
  - H2: Relacionado

## concepts/personal-agent-benchmark-pack.md

- Rota: /concepts/personal-agent-benchmark-pack
- Títulos:
  - H2: Cenários
  - H2: Modelo de privacidade
  - H2: Estendendo o pacote

## concepts/presence.md

- Rota: /concepts/presence
- Títulos:
  - H2: Campos de presença (o que aparece)
  - H2: Produtores (de onde a presença vem)
  - H3: 1) Entrada própria do Gateway
  - H3: 2) Conexão WebSocket
  - H4: Por que comandos CLI avulsos não aparecem
  - H3: 3) beacons de system-event
  - H3: 4) Conexões de Node (função: node)
  - H2: Regras de mesclagem + desduplicação (por que instanceId importa)
  - H2: TTL e tamanho limitado
  - H2: Observação sobre remoto/túnel (IPs de loopback)
  - H2: Consumidores
  - H3: Aba Instâncias no macOS
  - H2: Dicas de depuração
  - H2: Relacionado

## concepts/progress-drafts.md

- Rota: /concepts/progress-drafts
- Títulos:
  - H2: Início rápido
  - H2: O que os usuários veem
  - H2: Escolha um modo
  - H2: Configure rótulos
  - H2: Controle linhas de progresso
  - H2: Comportamento do canal
  - H2: Finalização
  - H2: Solução de problemas
  - H2: Relacionado

## concepts/qa-e2e-automation.md

- Rota: /concepts/qa-e2e-automation
- Títulos:
  - H2: Superfície de comandos
  - H2: Fluxo do operador
  - H2: Cobertura de transporte ao vivo
  - H2: Referência de QA para Telegram, Discord, Slack e WhatsApp
  - H3: Flags CLI compartilhadas
  - H3: QA do Telegram
  - H3: QA do Discord
  - H3: QA do Slack
  - H4: Configurando o workspace do Slack
  - H3: QA do WhatsApp
  - H3: Pool de credenciais do Convex
  - H2: Seeds baseados no repositório
  - H2: Faixas de mock de provedor
  - H2: Adaptadores de transporte
  - H3: Adicionando um canal
  - H3: Nomes de helpers de cenário
  - H2: Relatórios
  - H2: Documentação relacionada

## concepts/qa-matrix.md

- Rota: /concepts/qa-matrix
- Títulos:
  - H2: Início rápido
  - H2: O que a faixa faz
  - H2: CLI
  - H3: Flags comuns
  - H3: Flags de provedor
  - H2: Perfis
  - H2: Cenários
  - H2: Variáveis de ambiente
  - H2: Artefatos de saída
  - H2: Dicas de triagem
  - H2: Contrato de transporte ao vivo
  - H2: Relacionado

## concepts/queue-steering.md

- Rota: /concepts/queue-steering
- Títulos:
  - H2: Limite de runtime
  - H2: Modos
  - H2: Exemplo de rajada
  - H2: Escopo
  - H2: Debounce
  - H2: Relacionado

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
  - H2: Sobrescritas por sessão
  - H2: Escopo e garantias
  - H2: Solução de problemas
  - H2: Relacionado

## concepts/retry.md

- Rota: /concepts/retry
- Títulos:
  - H2: Objetivos
  - H2: Padrões
  - H2: Comportamento
  - H3: Provedores de modelo
  - H3: Discord
  - H3: Telegram
  - H2: Configuração
  - H2: Observações
  - H2: Relacionado

## concepts/session-pruning.md

- Rota: /concepts/session-pruning
- Títulos:
  - H2: Por que isso importa
  - H2: Como funciona
  - H2: Limpeza de imagens legadas
  - H2: Padrões inteligentes
  - H2: Habilitar ou desabilitar
  - H2: Poda vs compaction
  - H2: Leitura adicional
  - H2: Relacionado

## concepts/session-tool.md

- Rota: /concepts/session-tool
- Títulos:
  - H2: Ferramentas disponíveis
  - H2: Listando e lendo sessões
  - H2: Enviando mensagens entre sessões
  - H2: Helpers de status e orquestração
  - H2: Gerando subagentes
  - H2: Visibilidade
  - H2: Leitura adicional
  - H2: Relacionado

## concepts/session.md

- Rota: /concepts/session
- Títulos:
  - H2: Como as mensagens são roteadas
  - H2: Isolamento de DM
  - H3: Canais vinculados ao Dock
  - H2: Ciclo de vida da sessão
  - H2: Onde o estado fica
  - H2: Manutenção da sessão
  - H2: Inspecionando sessões
  - H2: Leitura adicional
  - H2: Relacionado

## concepts/soul.md

- Rota: /concepts/soul
- Títulos:
  - H2: O que pertence ao SOUL.md
  - H2: Por que isso funciona
  - H2: O prompt do Molty
  - H2: Como é um bom resultado
  - H2: Um aviso
  - H2: Relacionado

## concepts/streaming.md

- Rota: /concepts/streaming
- Títulos:
  - H2: Streaming em blocos (mensagens de canal)
  - H3: Entrega de mídia com streaming em blocos
  - H2: Algoritmo de divisão em partes (limites baixo/alto)
  - H2: Coalescência (mesclar blocos transmitidos)
  - H2: Ritmo semelhante ao humano entre blocos
  - H2: "Transmitir partes ou tudo"
  - H2: Modos de streaming de prévia
  - H3: Mapeamento de canal
  - H3: Comportamento de runtime
  - H3: Atualizações de prévia de progresso de ferramenta
  - H3: Faixa de progresso de comentário
  - H2: Relacionado

## concepts/system-prompt.md

- Rota: /concepts/system-prompt
- Títulos:
  - H2: Estrutura
  - H2: Modos de prompt
  - H2: Snapshots de prompt
  - H2: Injeção de bootstrap do workspace
  - H2: Tratamento de horário
  - H2: Skills
  - H2: Documentação
  - H2: Relacionado

## concepts/timezone.md

- Rota: /concepts/timezone
- Títulos:
  - H2: Três superfícies de fuso horário
  - H2: Definindo o fuso horário do usuário
  - H2: Quando sobrescrever
  - H2: Relacionado

## concepts/typebox.md

- Rota: /concepts/typebox
- Títulos:
  - H2: Modelo mental (30 segundos)
  - H2: Onde os schemas ficam
  - H2: Pipeline atual
  - H2: Como os schemas são usados em runtime
  - H2: Frames de exemplo
  - H2: Cliente mínimo (Node.js)
  - H2: Exemplo trabalhado: adicionar um método de ponta a ponta
  - H2: Comportamento do codegen Swift
  - H2: Versionamento + compatibilidade
  - H2: Padrões e convenções de schema
  - H2: JSON de schema ao vivo
  - H2: Quando você altera schemas
  - H2: Relacionado

## concepts/typing-indicators.md

- Rota: /concepts/typing-indicators
- Títulos:
  - H2: Padrões
  - H2: Modos
  - H2: Configuração
  - H2: Observações
  - H2: Relacionado

## concepts/usage-tracking.md

- Rota: /concepts/usage-tracking
- Títulos:
  - H2: O que é
  - H2: Onde aparece
  - H2: Modo padrão de rodapé de uso
  - H3: Três estados distintos de sessão
  - H3: Precedência
  - H3: Redefinir vs. desativar
  - H3: Comportamento do alternador
  - H3: Configuração
  - H2: Rodapé completo de /usage personalizado
  - H3: Formato
  - H3: Caminhos de contrato
  - H3: Verbos
  - H3: Formas de partes
  - H3: Exemplo
  - H2: Provedores + credenciais
  - H2: Relacionado

## date-time.md

- Rota: /date-time
- Títulos:
  - H2: Envelopes de mensagem (local por padrão)
  - H3: Exemplos
  - H2: Prompt do sistema: data e hora atuais
  - H2: Linhas de evento do sistema (locais por padrão)
  - H3: Configurar fuso horário + formato do usuário
  - H2: Detecção de formato de hora (automática)
  - H2: Payloads de ferramenta + conectores (horário bruto do provedor + campos normalizados)
  - H2: Documentação relacionada

## debug/node-issue.md

- Rota: /debug/node-issue
- Títulos:
  - H1: Falha do Node + tsx "\\name is not a function"
  - H2: Resumo
  - H2: Ambiente
  - H2: Reprodução (somente Node)
  - H2: Reprodução mínima no repositório
  - H2: Verificação de versão do Node
  - H2: Observações / hipótese
  - H2: Histórico de regressão
  - H2: Soluções alternativas
  - H2: Referências
  - H2: Próximos passos
  - H2: Relacionado

## diagnostics/flags.md

- Rota: /diagnostics/flags
- Títulos:
  - H2: Como funciona
  - H2: Habilitar via configuração
  - H2: Sobrescrita de env (avulsa)
  - H2: Flags de profiling
  - H2: Artefatos de linha do tempo
  - H2: Para onde os logs vão
  - H2: Extrair logs
  - H2: Observações
  - H2: Relacionado

## gateway/authentication.md

- Rota: /gateway/authentication
- Títulos:
  - H2: Configuração recomendada (chave de API, qualquer provedor)
  - H2: Anthropic: compatibilidade com CLI Claude e token
  - H2: Observação sobre Anthropic
  - H2: Verificando o status de autenticação do modelo
  - H2: Comportamento de rotação de chave de API (gateway)
  - H2: Removendo autenticação de provedor enquanto o gateway está em execução
  - H2: Controlando qual credencial é usada
  - H3: OpenAI e ids legados openai-codex
  - H3: Durante o login (CLI)
  - H3: Por sessão (comando de chat)
  - H3: Por agente (sobrescrita da CLI)
  - H2: Solução de problemas
  - H3: "Nenhuma credencial encontrada"
  - H3: Token expirando/expirado
  - H2: Relacionado

## gateway/background-process.md

- Rota: /gateway/background-process
- Títulos:
  - H2: ferramenta exec
  - H2: Ponte de processo filho
  - H2: ferramenta process
  - H2: Exemplos
  - H2: Relacionado

## gateway/bonjour.md

- Rota: /gateway/bonjour
- Títulos:
  - H2: Bonjour de área ampla (DNS-SD unicast) sobre Tailscale
  - H3: Configuração do Gateway (recomendada)
  - H3: Configuração única do servidor DNS (host do gateway)
  - H3: Configurações de DNS do Tailscale
  - H3: Segurança do listener do Gateway (recomendada)
  - H2: O que anuncia
  - H2: Tipos de serviço
  - H2: Chaves TXT (dicas não secretas)
  - H2: Depuração no macOS
  - H2: Depuração nos logs do Gateway
  - H2: Depuração no nó iOS
  - H2: Quando habilitar Bonjour
  - H2: Quando desabilitar Bonjour
  - H2: Pegadinhas do Docker
  - H2: Solução de problemas do Bonjour desabilitado
  - H2: Modos comuns de falha
  - H2: Nomes de instância escapados (\032)
  - H2: Habilitação / desabilitação / configuração
  - H2: Documentação relacionada

## gateway/bridge-protocol.md

- Rota: /gateway/bridge-protocol
- Títulos:
  - H2: Por que existia
  - H2: Transporte
  - H2: Handshake + pareamento
  - H2: Frames
  - H2: Eventos de ciclo de vida do exec
  - H2: Uso histórico de tailnet
  - H2: Versionamento
  - H2: Relacionado

## gateway/cli-backends.md

- Rota: /gateway/cli-backends
- Títulos:
  - H2: Início rápido amigável para iniciantes
  - H2: Usando como fallback
  - H2: Visão geral da configuração
  - H3: Configuração de exemplo
  - H2: Como funciona
  - H2: Sessões
  - H2: Prelúdio de fallback de sessões claude-cli
  - H2: Imagens (pass-through)
  - H2: Entradas / saídas
  - H2: Padrões (pertencentes ao plugin)
  - H2: Padrões pertencentes ao plugin
  - H2: Propriedade da compaction nativa
  - H2: Sobreposições MCP de bundle
  - H2: Limite de reseed de histórico
  - H2: Limitações
  - H2: Solução de problemas
  - H2: Relacionado

## gateway/config-agents.md

- Rota: /gateway/config-agents
- Títulos:
  - H2: Padrões de agente
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Sobrescritas de perfil de bootstrap por agente
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
  - H3: Política de runtime
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming em blocos
  - H3: Indicadores de digitação
  - H3: agents.defaults.sandbox
  - H3: agents.list (sobrescritas por agente)
  - H2: Roteamento multiagente
  - H3: Campos de correspondência de vinculação
  - H3: Perfis de acesso por agente
  - H2: Sessão
  - H2: Mensagens
  - H3: Prefixo de resposta
  - H3: Reação de confirmação
  - H3: Debounce de entrada
  - H3: TTS (text-to-speech)
  - H2: Fala
  - H2: Relacionado

## gateway/config-channels.md

- Rota: /gateway/config-channels
- Títulos:
  - H2: Canais
  - H3: Acesso a DM e grupos
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
  - H3: Controle de menções em chats de grupo
  - H4: Limites de histórico de DM
  - H4: Modo de chat consigo mesmo
  - H3: Comandos (tratamento de comandos de chat)
  - H2: Relacionado

## gateway/config-tools.md

- Rota: /gateway/config-tools
- Títulos:
  - H2: Ferramentas
  - H3: Perfis de ferramentas
  - H3: Grupos de ferramentas
  - H3: Ferramentas MCP e de Plugin dentro da política de ferramentas da sandbox
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
  - H3: Detalhes do campo de provedor
  - H3: Exemplos de provedor
  - H2: Relacionado

## gateway/configuration-examples.md

- Rota: /gateway/configuration-examples
- Títulos:
  - H2: Início rápido
  - H3: Mínimo absoluto
  - H3: Inicial recomendado
  - H2: Exemplo expandido (principais opções)
  - H3: Repositório irmão de Skills vinculado por symlink
  - H2: Padrões comuns
  - H3: Linha de base compartilhada de Skills com uma substituição
  - H3: Configuração multiplataforma
  - H3: Aprovação automática de rede de nós confiáveis
  - H3: Modo de DM seguro (caixa de entrada compartilhada / DMs multiusuário)
  - H3: Chave de API da Anthropic + fallback MiniMax
  - H3: Bot de trabalho (acesso restrito)
  - H3: Apenas modelos locais
  - H2: Dicas
  - H2: Relacionado

## gateway/configuration-reference.md

- Rota: /gateway/configuration-reference
- Títulos:
  - H2: Canais
  - H2: Padrões de agente, multiagente, sessões e mensagens
  - H2: Ferramentas e provedores personalizados
  - H2: Modelos
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Configuração do Plugin de harness Codex
  - H2: Compromissos
  - H2: Navegador
  - H2: UI
  - H2: Gateway
  - H3: Endpoints compatíveis com OpenAI
  - H3: Isolamento de várias instâncias
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooks
  - H3: Integração com Gmail
  - H2: Host de Plugin de Canvas
  - H2: Descoberta
  - H3: mDNS (Bonjour)
  - H3: Área ampla (DNS-SD)
  - H2: Ambiente
  - H3: env (variáveis de ambiente inline)
  - H3: Substituição de variáveis de ambiente
  - H2: Segredos
  - H3: SecretRef
  - H3: Superfície de credenciais compatível
  - H3: Configuração de provedores de segredo
  - H2: Armazenamento de autenticação
  - H3: auth.cooldowns
  - H2: Logs
  - H2: Diagnósticos
  - H2: Atualização
  - H2: ACP
  - H2: CLI
  - H2: Assistente
  - H2: Identidade
  - H2: Bridge (legado, removido)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Variáveis de modelo de mídia
  - H2: Inclusões de configuração ($include)
  - H2: Relacionado

## gateway/configuration.md

- Rota: /gateway/configuration
- Títulos:
  - H2: Configuração mínima
  - H2: Editando a configuração
  - H2: Validação estrita
  - H2: Tarefas comuns
  - H2: Recarregamento a quente da configuração
  - H3: Modos de recarregamento
  - H3: O que é aplicado a quente vs o que precisa de reinicialização
  - H3: Planejamento de recarregamento
  - H2: RPC de configuração (atualizações programáticas)
  - H2: Variáveis de ambiente
  - H2: Referência completa
  - H2: Relacionado

## gateway/diagnostics.md

- Rota: /gateway/diagnostics
- Títulos:
  - H2: Início rápido
  - H2: Comando de chat
  - H2: O que a exportação contém
  - H2: Modelo de privacidade
  - H2: Gravador de estabilidade
  - H2: Opções úteis
  - H2: Desativar diagnósticos
  - H2: Relacionado

## gateway/discovery.md

- Rota: /gateway/discovery
- Títulos:
  - H2: Termos
  - H2: Por que mantemos tanto direto quanto SSH
  - H2: Entradas de descoberta (como os clientes descobrem onde está o gateway)
  - H3: 1) Descoberta Bonjour / DNS-SD
  - H4: Detalhes do beacon de serviço
  - H3: 2) Tailnet (entre redes)
  - H3: 3) Alvo manual / SSH
  - H2: Seleção de transporte (política do cliente)
  - H2: Pareamento + autenticação (transporte direto)
  - H2: Responsabilidades por componente
  - H2: Relacionado

## gateway/doctor.md

- Rota: /gateway/doctor
- Títulos:
  - H2: Início rápido
  - H3: Modos headless e de automação
  - H2: Modo de lint somente leitura
  - H2: O que ele faz (resumo)
  - H2: Backfill e redefinição da UI de sonhos
  - H2: Comportamento detalhado e justificativa
  - H2: Relacionado

## gateway/external-apps.md

- Rota: /gateway/external-apps
- Títulos:
  - H2: O que está disponível hoje
  - H2: Caminho recomendado
  - H2: Código de app vs código de Plugin
  - H2: Relacionado

## gateway/gateway-lock.md

- Rota: /gateway/gateway-lock
- Títulos:
  - H2: Por quê
  - H2: Mecanismo
  - H2: Superfície de erro
  - H2: Notas operacionais
  - H2: Relacionado

## gateway/health.md

- Rota: /gateway/health
- Títulos:
  - H2: Verificações rápidas
  - H2: Diagnósticos profundos
  - H2: Configuração do monitor de integridade
  - H2: Monitoramento de uptime
  - H3: Exemplos de configuração de serviço de monitoramento
  - H2: Quando algo falha
  - H2: Comando "health" dedicado
  - H2: Relacionado

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
  - H3: Exemplo de horários ativos
  - H3: Configuração 24/7
  - H3: Exemplo de várias contas
  - H3: Notas de campo
  - H2: Comportamento de entrega
  - H2: Controles de visibilidade
  - H3: O que cada flag faz
  - H3: Exemplos por canal vs por conta
  - H3: Padrões comuns
  - H2: HEARTBEAT.md (opcional)
  - H3: blocos tasks:
  - H3: O agente pode atualizar HEARTBEAT.md?
  - H2: Ativação manual (sob demanda)
  - H2: Entrega de raciocínio (opcional)
  - H2: Consciência de custo
  - H2: Estouro de contexto após Heartbeat
  - H2: Relacionado

## gateway/index.md

- Rota: /gateway
- Títulos:
  - H2: Inicialização local em 5 minutos
  - H2: Modelo de runtime
  - H2: Endpoints compatíveis com OpenAI
  - H3: Precedência de porta e bind
  - H3: Modos de recarregamento a quente
  - H2: Conjunto de comandos do operador
  - H2: Vários gateways (mesmo host)
  - H2: Acesso remoto
  - H2: Supervisão e ciclo de vida do serviço
  - H2: Caminho rápido de perfil de desenvolvimento
  - H2: Referência rápida de protocolo (visão do operador)
  - H2: Verificações operacionais
  - H3: Liveness
  - H3: Readiness
  - H3: Recuperação de lacunas
  - H2: Assinaturas comuns de falha
  - H2: Garantias de segurança
  - H2: Relacionado

## gateway/local-model-services.md

- Rota: /gateway/local-model-services
- Títulos:
  - H2: Como funciona
  - H2: Formato da configuração
  - H2: Campos
  - H2: Exemplo de Inferrs
  - H2: Exemplo de ds4
  - H2: Notas operacionais
  - H2: Relacionado

## gateway/local-models.md

- Rota: /gateway/local-models
- Títulos:
  - H2: Piso de hardware
  - H2: Escolha um backend
  - H2: Recomendado: LM Studio + modelo local grande (Responses API)
  - H3: Configuração híbrida: primário hospedado, fallback local
  - H3: Local primeiro com rede de segurança hospedada
  - H3: Hospedagem regional / roteamento de dados
  - H2: Outros proxies locais compatíveis com OpenAI
  - H2: Backends menores ou mais estritos
  - H2: Solução de problemas
  - H2: Relacionado

## gateway/logging.md

- Rota: /gateway/logging
- Títulos:
  - H1: Logs
  - H2: Logger baseado em arquivo
  - H2: Captura do console
  - H2: Redação
  - H2: Logs de WebSocket do Gateway
  - H3: Estilo de log WS
  - H2: Formatação do console (logs de subsistema)
  - H2: Relacionado

## gateway/multiple-gateways.md

- Rota: /gateway/multiple-gateways
- Títulos:
  - H2: Melhor configuração recomendada
  - H2: Início rápido do Rescue-Bot
  - H2: Por que isso funciona
  - H2: O que --profile rescue onboard muda
  - H2: Configuração geral de múltiplos gateways
  - H2: Checklist de isolamento
  - H2: Mapeamento de portas (derivado)
  - H2: Notas de navegador/CDP (armadilha comum)
  - H2: Exemplo manual de env
  - H2: Verificações rápidas
  - H2: Relacionado

## gateway/network-model.md

- Rota: /gateway/network-model
- Títulos:
  - H2: Relacionado

## gateway/openai-http-api.md

- Rota: /gateway/openai-http-api
- Títulos:
  - H2: Autenticação
  - H2: Limite de segurança (importante)
  - H2: Quando usar este endpoint
  - H2: Contrato de modelo agent-first
  - H2: Habilitando o endpoint
  - H2: Desabilitando o endpoint
  - H2: Comportamento de sessão
  - H2: Por que essa superfície importa
  - H2: Lista de modelos e roteamento de agentes
  - H2: Streaming (SSE)
  - H2: Contrato de ferramentas de chat
  - H3: Campos de solicitação compatíveis
  - H3: Variantes não compatíveis
  - H3: Formato de resposta de ferramenta sem streaming
  - H3: Formato de resposta de ferramenta com streaming
  - H3: Loop de acompanhamento de ferramentas
  - H2: Configuração rápida do Open WebUI
  - H2: Exemplos
  - H2: Relacionado

## gateway/openresponses-http-api.md

- Rota: /gateway/openresponses-http-api
- Títulos:
  - H2: Autenticação, segurança e roteamento
  - H2: Comportamento de sessão
  - H2: Formato da solicitação (compatível)
  - H2: Itens (entrada)
  - H3: message
  - H3: functioncalloutput (ferramentas baseadas em turnos)
  - H3: reasoning e itemreference
  - H2: Ferramentas (ferramentas de função do lado do cliente)
  - H2: Imagens (inputimage)
  - H2: Arquivos (inputfile)
  - H2: Limites de arquivo + imagem (configuração)
  - H2: Streaming (SSE)
  - H2: Uso
  - H2: Erros
  - H2: Exemplos
  - H2: Relacionado

## gateway/openshell.md

- Rota: /gateway/openshell
- Títulos:
  - H2: Pré-requisitos
  - H2: Início rápido
  - H2: Modos de workspace
  - H3: mirror
  - H3: remote
  - H3: Escolhendo um modo
  - H2: Referência de configuração
  - H2: Exemplos
  - H3: Configuração remota mínima
  - H3: Modo mirror com GPU
  - H3: OpenShell por agente com gateway personalizado
  - H2: Gerenciamento de ciclo de vida
  - H3: Quando recriar
  - H2: Reforço de segurança
  - H2: Limitações atuais
  - H2: Como funciona
  - H2: Relacionado

## gateway/opentelemetry.md

- Rota: /gateway/opentelemetry
- Títulos:
  - H2: Como tudo se encaixa
  - H2: Início rápido
  - H2: Sinais exportados
  - H2: Referência de configuração
  - H3: Variáveis de ambiente
  - H2: Privacidade e captura de conteúdo
  - H2: Amostragem e flush
  - H2: Métricas exportadas
  - H3: Uso de modelo
  - H3: Fluxo de mensagens
  - H3: Conversa
  - H3: Filas e sessões
  - H3: Telemetria de liveness de sessão
  - H3: Ciclo de vida do harness
  - H3: Execução de ferramentas
  - H3: Exec
  - H3: Internos de diagnóstico (memória e loop de ferramentas)
  - H2: Spans exportados
  - H2: Catálogo de eventos de diagnóstico
  - H2: Sem um exportador
  - H2: Desativar
  - H2: Relacionado

## gateway/operator-scopes.md

- Rota: /gateway/operator-scopes
- Títulos:
  - H2: Funções
  - H2: Níveis de escopo
  - H2: O escopo do método é apenas a primeira barreira
  - H2: Aprovações de pareamento de dispositivos
  - H2: Aprovações de pareamento de Node
  - H2: Autenticação por segredo compartilhado

## gateway/pairing.md

- Rota: /gateway/pairing
- Títulos:
  - H2: Conceitos
  - H2: Como o pareamento funciona
  - H2: Fluxo de trabalho da CLI (amigável a headless)
  - H2: Superfície de API (protocolo do gateway)
  - H2: Controle de comandos de Node (2026.3.31+)
  - H2: Limites de confiança de eventos de Node (2026.3.31+)
  - H2: Aprovação automática (app macOS)
  - H2: Aprovação automática de dispositivos por CIDR confiável
  - H2: Aprovação automática de upgrade de metadados
  - H2: Auxiliares de pareamento por QR
  - H2: Localidade e cabeçalhos encaminhados
  - H2: Armazenamento (local, privado)
  - H2: Comportamento de transporte
  - H2: Relacionado

## gateway/prometheus.md

- Rota: /gateway/prometheus
- Títulos:
  - H2: Início rápido
  - H2: Métricas exportadas
  - H2: Política de rótulos
  - H2: Receitas PromQL
  - H2: Escolhendo entre exportação Prometheus e OpenTelemetry
  - H2: Solução de problemas
  - H2: Relacionado

## gateway/protocol.md

- Rota: /gateway/protocol
- Títulos:
  - H2: Transporte
  - H2: Handshake (conexão)
  - H3: Exemplo de Node
  - H2: Framing
  - H2: Funções + escopos
  - H3: Funções
  - H3: Escopos (operador)
  - H3: Caps/comandos/permissões (node)
  - H2: Presença
  - H3: Evento de Node ativo em segundo plano
  - H2: Escopo de eventos de broadcast
  - H2: Famílias comuns de métodos RPC
  - H3: Famílias comuns de eventos
  - H3: Métodos auxiliares de Node
  - H3: RPCs do ledger de tarefas
  - H3: Métodos auxiliares do operador
  - H3: Visualizações de models.list
  - H2: Aprovações de Exec
  - H2: Fallback de entrega de agente
  - H2: Versionamento
  - H3: Constantes do cliente
  - H2: Auth
  - H2: Identidade do dispositivo + pareamento
  - H3: Diagnósticos de migração de auth do dispositivo
  - H2: TLS + pinning
  - H2: Escopo
  - H2: Relacionado

## gateway/remote-gateway-readme.md

- Rota: /gateway/remote-gateway-readme
- Títulos:
  - H1: Executando o OpenClaw.app com um Gateway remoto
  - H2: Visão geral
  - H2: Configuração rápida
  - H3: Etapa 1: adicione a configuração SSH
  - H3: Etapa 2: copie a chave SSH
  - H3: Etapa 3: configure a autenticação do Gateway remoto
  - H3: Etapa 4: inicie o túnel SSH
  - H3: Etapa 5: reinicie o OpenClaw.app
  - H2: Iniciar túnel automaticamente no login
  - H3: Crie o arquivo PLIST
  - H3: Carregue o Launch Agent
  - H2: Solução de problemas
  - H2: Como funciona
  - H2: Relacionado

## gateway/remote.md

- Rota: /gateway/remote
- Títulos:
  - H2: A ideia central
  - H2: Configurações comuns de VPN e tailnet
  - H3: Gateway sempre ativo na sua tailnet
  - H3: Desktop doméstico executa o Gateway
  - H3: Laptop executa o Gateway
  - H2: Fluxo de comandos (o que executa onde)
  - H2: Túnel SSH (CLI + ferramentas)
  - H2: Padrões remotos da CLI
  - H2: Precedência de credenciais
  - H2: Acesso remoto à interface de chat
  - H2: Modo remoto do app para macOS
  - H2: Regras de segurança (remoto/VPN)
  - H3: macOS: túnel SSH persistente via LaunchAgent
  - H4: Etapa 1: adicione a configuração SSH
  - H4: Etapa 2: copie a chave SSH (uma vez)
  - H4: Etapa 3: configure o token do Gateway
  - H4: Etapa 4: crie o LaunchAgent
  - H4: Etapa 5: carregue o LaunchAgent
  - H4: Solução de problemas
  - H2: Relacionado

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Rota: /gateway/sandbox-vs-tool-policy-vs-elevated
- Títulos:
  - H2: Depuração rápida
  - H2: Sandbox: onde as ferramentas executam
  - H3: Montagens bind (verificação rápida de segurança)
  - H2: Política de ferramentas: quais ferramentas existem/podem ser chamadas
  - H3: Grupos de ferramentas (atalhos)
  - H2: Elevado: "executar no host" somente para exec
  - H2: Correções comuns para "prisão do sandbox"
  - H3: "Ferramenta X bloqueada pela política de ferramentas do sandbox"
  - H3: "Achei que isto fosse principal; por que está em sandbox?"
  - H2: Relacionado

## gateway/sandboxing.md

- Rota: /gateway/sandboxing
- Títulos:
  - H2: O que entra em sandbox
  - H2: Modos
  - H2: Escopo
  - H2: Backend
  - H3: Escolhendo um backend
  - H3: Backend Docker
  - H3: Backend SSH
  - H3: Backend OpenShell
  - H4: Modos de workspace
  - H4: Ciclo de vida do OpenShell
  - H2: Acesso ao workspace
  - H2: Montagens bind personalizadas
  - H2: Imagens e configuração
  - H2: setupCommand (configuração única do contêiner)
  - H2: Política de ferramentas e rotas de escape
  - H2: Substituições multiagente
  - H2: Exemplo mínimo de ativação
  - H2: Relacionado

## gateway/secrets-plan-contract.md

- Rota: /gateway/secrets-plan-contract
- Títulos:
  - H2: Formato do arquivo de plano
  - H2: Upserts e exclusões de provedor
  - H2: Escopo de destino compatível
  - H2: Comportamento do tipo de destino
  - H2: Regras de validação de caminho
  - H2: Comportamento em caso de falha
  - H2: Comportamento de consentimento do provedor exec
  - H2: Observações sobre escopo de runtime e auditoria
  - H2: Verificações do operador
  - H2: Documentos relacionados

## gateway/secrets.md

- Rota: /gateway/secrets
- Títulos:
  - H2: Objetivos e modelo de runtime
  - H2: Limite de acesso do agente
  - H2: Filtragem de superfície ativa
  - H2: Diagnósticos da superfície de autenticação do Gateway
  - H2: Pré-verificação de referência de onboarding
  - H2: Contrato SecretRef
  - H2: Configuração do provedor
  - H2: Chaves de API baseadas em arquivo
  - H2: Exemplos de integração exec
  - H2: Variáveis de ambiente do servidor MCP
  - H2: Material de autenticação SSH do sandbox
  - H2: Superfície de credenciais compatível
  - H2: Comportamento e precedência obrigatórios
  - H2: Gatilhos de ativação
  - H2: Sinais degradados e recuperados
  - H2: Resolução de caminho de comando
  - H2: Fluxo de trabalho de auditoria e configuração
  - H2: Política de segurança unidirecional
  - H2: Observações de compatibilidade de autenticação legada
  - H2: Observação sobre a interface Web
  - H2: Relacionado

## gateway/security/audit-checks.md

- Rota: /gateway/security/audit-checks
- Títulos:
  - H2: Relacionado

## gateway/security/exposure-runbook.md

- Rota: /gateway/security/exposure-runbook
- Títulos:
  - H2: Escolha o padrão de exposição
  - H2: Inventário prévio
  - H2: Verificações de linha de base
  - H2: Linha de base mínima segura
  - H2: Exposição em DM e grupos
  - H2: Verificações de proxy reverso
  - H2: Revisão de ferramentas e sandbox
  - H2: Validação pós-alteração
  - H2: Plano de rollback
  - H2: Checklist de revisão

## gateway/security/index.md

- Rota: /gateway/security
- Títulos:
  - H2: Escopo primeiro: modelo de segurança de assistente pessoal
  - H2: Verificação rápida: openclaw security audit
  - H3: Bloqueio de dependências do pacote publicado
  - H3: Confiança em implantação e host
  - H3: Operações de arquivo seguras
  - H3: Workspace Slack compartilhado: risco real
  - H3: Agente compartilhado pela empresa: padrão aceitável
  - H2: Conceito de confiança de Gateway e Node
  - H2: Matriz de limites de confiança
  - H2: Não são vulnerabilidades por design
  - H2: Linha de base reforçada em 60 segundos
  - H2: Regra rápida para caixa de entrada compartilhada
  - H2: Modelo de visibilidade de contexto
  - H2: O que a auditoria verifica (alto nível)
  - H2: Mapa de armazenamento de credenciais
  - H2: Checklist de auditoria de segurança
  - H2: Glossário de auditoria de segurança
  - H2: Interface de controle via HTTP
  - H2: Resumo de flags inseguras ou perigosas
  - H2: Configuração de proxy reverso
  - H2: Observações sobre HSTS e origem
  - H2: Logs de sessão locais ficam no disco
  - H2: Execução de Node (system.run)
  - H2: Skills dinâmicas (watcher / nós remotos)
  - H2: O modelo de ameaças
  - H2: Conceito central: controle de acesso antes da inteligência
  - H2: Modelo de autorização de comandos
  - H2: Risco das ferramentas do plano de controle
  - H2: Plugins
  - H2: Modelo de acesso a DM: pareamento, lista de permissões, aberto, desativado
  - H2: Isolamento de sessão de DM (modo multiusuário)
  - H3: Modo de DM seguro (recomendado)
  - H2: Listas de permissões para DMs e grupos
  - H2: Injeção de prompt (o que é, por que importa)
  - H2: Sanitização de tokens especiais em conteúdo externo
  - H2: Flags de bypass para conteúdo externo inseguro
  - H3: Injeção de prompt não exige DMs públicas
  - H3: Backends de LLM auto-hospedados
  - H3: Força do modelo (observação de segurança)
  - H2: Raciocínio e saída detalhada em grupos
  - H2: Exemplos de reforço de configuração
  - H3: Permissões de arquivo
  - H3: Exposição de rede (bind, porta, firewall)
  - H3: Publicação de porta Docker com UFW
  - H3: Descoberta mDNS/Bonjour
  - H3: Bloqueie o WebSocket do Gateway (autenticação local)
  - H3: Cabeçalhos de identidade do Tailscale Serve
  - H3: Controle do navegador via host Node (recomendado)
  - H3: Segredos no disco
  - H3: Arquivos .env do workspace
  - H3: Logs e transcritos (redação e retenção)
  - H3: DMs: pareamento por padrão
  - H3: Grupos: exigir menção em todos os lugares
  - H3: Números separados (WhatsApp, Signal, Telegram)
  - H3: Modo somente leitura (via sandbox e ferramentas)
  - H3: Linha de base segura (copiar/colar)
  - H2: Sandboxing (recomendado)
  - H3: Guardrail de delegação de subagente
  - H2: Riscos de controle do navegador
  - H3: Política SSRF do navegador (estrita por padrão)
  - H2: Perfis de acesso por agente (multiagente)
  - H3: Exemplo: acesso total (sem sandbox)
  - H3: Exemplo: ferramentas somente leitura + workspace somente leitura
  - H3: Exemplo: sem acesso ao sistema de arquivos/shell (mensagens do provedor permitidas)
  - H2: Resposta a incidentes
  - H3: Conter
  - H3: Rotacionar (presuma comprometimento se segredos vazaram)
  - H3: Auditar
  - H3: Coletar para um relatório
  - H2: Varredura de segredos
  - H2: Relatar problemas de segurança

## gateway/security/secure-file-operations.md

- Rota: /gateway/security/secure-file-operations
- Títulos:
  - H2: Padrão: sem helper Python
  - H2: O que permanece protegido sem Python
  - H2: O que Python adiciona
  - H2: Orientação para Plugin e core

## gateway/security/shrinkwrap.md

- Rota: /gateway/security/shrinkwrap
- Títulos:
  - H2: A versão simples
  - H2: Por que o OpenClaw usa isso
  - H2: Detalhes técnicos

## gateway/tailscale.md

- Rota: /gateway/tailscale
- Títulos:
  - H2: Modos
  - H2: Autenticação
  - H2: Exemplos de configuração
  - H3: Somente tailnet (Serve)
  - H3: Somente tailnet (vincular ao IP da tailnet)
  - H3: Internet pública (Funnel + senha compartilhada)
  - H2: Exemplos de CLI
  - H2: Observações
  - H2: Controle do navegador (Gateway remoto + navegador local)
  - H2: Pré-requisitos + limites do Tailscale
  - H2: Saiba mais
  - H2: Relacionado

## gateway/tools-invoke-http-api.md

- Rota: /gateway/tools-invoke-http-api
- Títulos:
  - H2: Autenticação
  - H2: Limite de segurança (importante)
  - H2: Corpo da solicitação
  - H2: Política + comportamento de roteamento
  - H2: Respostas
  - H2: Exemplo
  - H2: Relacionado

## gateway/troubleshooting.md

- Rota: /gateway/troubleshooting
- Títulos:
  - H2: Escada de comandos
  - H2: Após uma atualização
  - H2: Instalações split brain e proteção de configuração mais recente
  - H2: Incompatibilidade de protocolo após rollback
  - H2: Symlink de Skill ignorado como escape de caminho
  - H2: Anthropic 429 exige uso extra para contexto longo
  - H2: Respostas upstream 403 bloqueadas
  - H2: Backend local compatível com OpenAI passa em sondagens diretas, mas execuções de agente falham
  - H2: Sem respostas
  - H2: Conectividade da interface de controle do dashboard
  - H3: Mapa rápido de códigos de detalhe de autenticação
  - H2: Serviço Gateway não está em execução
  - H2: Gateway no macOS para de responder silenciosamente e retoma quando você toca no dashboard
  - H2: Gateway sai durante alto uso de memória
  - H2: Gateway rejeitou configuração inválida
  - H2: Avisos de sondagem do Gateway
  - H2: Canal conectado, mensagens não fluem
  - H2: Entrega de Cron e Heartbeat
  - H2: Node pareado, ferramenta falha
  - H2: Ferramenta de navegador falha
  - H2: Se você atualizou e algo quebrou de repente
  - H2: Relacionado

## gateway/trusted-proxy-auth.md

- Rota: /gateway/trusted-proxy-auth
- Títulos:
  - H2: Quando usar
  - H2: Quando NÃO usar
  - H2: Como funciona
  - H2: Comportamento de pareamento da interface de controle
  - H2: Configuração
  - H3: Referência de configuração
  - H2: Terminação TLS e HSTS
  - H3: Orientação de rollout
  - H2: Exemplos de configuração de proxy
  - H2: Configuração mista de tokens
  - H2: Cabeçalho de escopos do operador
  - H2: Checklist de segurança
  - H2: Auditoria de segurança
  - H2: Solução de problemas
  - H2: Migração da autenticação por token
  - H2: Relacionado

## help/debugging.md

- Rota: /help/debugging
- Títulos:
  - H2: Substituições de depuração em runtime
  - H2: Saída de rastreamento de sessão
  - H2: Rastreamento do ciclo de vida de Plugin
  - H2: Profiling de inicialização e comandos da CLI
  - H2: Modo de observação do Gateway
  - H2: Perfil de desenvolvimento + Gateway de desenvolvimento (--dev)
  - H2: Registro bruto de stream (OpenClaw)
  - H2: Registro bruto de chunks compatíveis com OpenAI
  - H2: Observações de segurança
  - H2: Depuração no VSCode
  - H3: Configuração
  - H3: Observações
  - H2: Relacionado

## help/environment.md

- Rota: /help/environment
- Títulos:
  - H2: Precedência (maior → menor)
  - H2: Credenciais de provedor e .env do workspace
  - H2: Bloco env da configuração
  - H2: Importação de env do shell
  - H2: Snapshots do shell exec
  - H2: Variáveis de env injetadas em runtime
  - H2: Variáveis de env da UI
  - H2: Substituição de variável de env na configuração
  - H2: Referências de segredo vs strings ${ENV}
  - H2: Variáveis de env relacionadas a caminho
  - H2: Logging
  - H3: OPENCLAWHOME
  - H2: Usuários de nvm: falhas de TLS no webfetch
  - H2: Variáveis de ambiente legadas
  - H2: Relacionado

## help/faq-first-run.md

- Rota: /help/faq-first-run
- Títulos:
  - H2: Início rápido e configuração da primeira execução
  - H2: Relacionado

## help/faq-models.md

- Rota: /help/faq-models
- Títulos:
  - H2: Modelos: padrões, seleção, aliases, troca
  - H2: Failover de modelo e "Todos os modelos falharam"
  - H2: Perfis de autenticação: o que são e como gerenciá-los
  - H2: Relacionado

## help/faq.md

- Rota: /help/faq
- Títulos:
  - H2: Primeiros 60 segundos se algo estiver quebrado
  - H2: Início rápido e configuração da primeira execução
  - H2: O que é o OpenClaw?
  - H2: Skills e automação
  - H2: Sandboxing e memória
  - H2: Onde as coisas ficam no disco
  - H2: Noções básicas de configuração
  - H2: Gateways e nós remotos
  - H2: Variáveis de env e carregamento de .env
  - H2: Sessões e vários chats
  - H2: Modelos, failover e perfis de autenticação
  - H2: Gateway: portas, "já em execução" e modo remoto
  - H2: Logging e depuração
  - H2: Mídia e anexos
  - H2: Segurança e controle de acesso
  - H2: Comandos de chat, abortar tarefas e "não vai parar"
  - H2: Diversos
  - H2: Relacionado

## help/index.md

- Rota: /help
- Títulos:
  - H2: FAQ
  - H2: Diagnósticos
  - H2: Testes
  - H2: Comunidade e metadados

## help/scripts.md

- Rota: /help/scripts
- Títulos:
  - H2: Convenções
  - H2: Scripts de monitoramento de autenticação
  - H2: Helper de leitura do GitHub
  - H2: Ao adicionar scripts
  - H2: Relacionado

## help/testing-live.md

- Rota: /help/testing-live
- Títulos:
  - H2: Live: comandos de smoke locais
  - H2: Live: varredura de capacidade de nó Android
  - H2: Live: smoke de modelo (chaves de perfil)
  - H3: Camada 1: conclusão direta de modelo (sem Gateway)
  - H3: Camada 2: Gateway + smoke de agente dev (o que "@openclaw" realmente faz)
  - H2: Live: smoke de backend CLI (Claude, Gemini ou outras CLIs locais)
  - H2: Live: alcançabilidade do proxy APNs HTTP/2
  - H2: Live: smoke de bind ACP (/acp spawn ... --bind here)
  - H2: Live: smoke do harness do servidor de app Codex
  - H3: Receitas live recomendadas
  - H2: Live: matriz de modelos (o que cobrimos)
  - H3: Conjunto de smoke moderno (chamada de ferramenta + imagem)
  - H3: Baseline: chamada de ferramenta (Read + Exec opcional)
  - H3: Visão: envio de imagem (anexo → mensagem multimodal)
  - H3: Agregadores / gateways alternativos
  - H2: Credenciais (nunca faça commit)
  - H2: Deepgram live (transcrição de áudio)
  - H2: BytePlus coding plan live
  - H2: ComfyUI workflow media live
  - H2: Geração de imagens live
  - H2: Geração de música live
  - H2: Geração de vídeo live
  - H2: Harness de mídia live
  - H2: Relacionado

## help/testing-updates-plugins.md

- Rota: /help/testing-updates-plugins
- Títulos:
  - H2: O que protegemos
  - H2: Prova local durante o desenvolvimento
  - H2: Lanes Docker
  - H2: Aceitação de pacote
  - H2: Padrão de release
  - H2: Compatibilidade legada
  - H2: Adicionar cobertura
  - H2: Triagem de falhas

## help/testing.md

- Rota: /help/testing
- Títulos:
  - H2: Início rápido
  - H2: Diretórios temporários de teste
  - H2: Runners específicos de QA
  - H3: Credenciais compartilhadas do Telegram via Convex (v1)
  - H3: Adicionar um canal ao QA
  - H2: Suítes de teste (o que roda onde)
  - H3: Unidade / integração (padrão)
  - H3: Estabilidade (Gateway)
  - H3: E2E (agregado do repo)
  - H3: E2E (smoke do Gateway)
  - H3: E2E (navegador mockado da Control UI)
  - H3: E2E: smoke do backend OpenShell
  - H3: Live (provedores reais + modelos reais)
  - H2: Qual suíte devo executar?
  - H2: Testes live (com acesso à rede)
  - H2: Runners Docker (verificações opcionais de "funciona no Linux")
  - H2: Sanidade da documentação
  - H2: Regressão offline (segura para CI)
  - H2: Avaliações de confiabilidade de agentes (skills)
  - H2: Testes de contrato (formato de Plugin e canal)
  - H3: Comandos
  - H3: Contratos de canal
  - H3: Contratos de status de provedor
  - H3: Contratos de provedor
  - H3: Quando executar
  - H2: Adicionar regressões (orientação)
  - H2: Relacionado

## help/troubleshooting.md

- Rota: /help/troubleshooting
- Títulos:
  - H2: Primeiros 60 segundos
  - H2: O assistente parece limitado ou sem ferramentas
  - H2: Contexto longo da Anthropic 429
  - H2: Backend local compatível com OpenAI funciona diretamente, mas falha no OpenClaw
  - H2: Instalação de Plugin falha com extensões openclaw ausentes
  - H2: Política de instalação bloqueia instalações ou atualizações de plugins
  - H2: Plugin presente, mas bloqueado por propriedade suspeita
  - H2: Árvore de decisão
  - H2: Relacionado

## index.md

- Rota: /
- Títulos:
  - H1: OpenClaw 🦞
  - H2: O que é OpenClaw?
  - H2: Como funciona
  - H2: Principais capacidades
  - H2: Início rápido
  - H2: Dashboard
  - H2: Configuração (opcional)
  - H2: Comece aqui
  - H2: Saiba mais

## install/ansible.md

- Rota: /install/ansible
- Títulos:
  - H2: Pré-requisitos
  - H2: O que você recebe
  - H2: Início rápido
  - H2: O que é instalado
  - H2: Configuração pós-instalação
  - H3: Comandos rápidos
  - H2: Arquitetura de segurança
  - H2: Instalação manual
  - H2: Atualizando
  - H2: Solução de problemas
  - H2: Configuração avançada
  - H2: Relacionado

## install/azure.md

- Rota: /install/azure
- Títulos:
  - H2: O que você fará
  - H2: O que você precisa
  - H2: Configurar implantação
  - H2: Implantar recursos do Azure
  - H2: Instalar OpenClaw
  - H2: Considerações de custo
  - H2: Limpeza
  - H2: Próximas etapas
  - H2: Relacionado

## install/bun.md

- Rota: /install/bun
- Títulos:
  - H2: Instalar
  - H2: Scripts de ciclo de vida
  - H2: Ressalvas
  - H2: Relacionado

## install/clawdock.md

- Rota: /install/clawdock
- Títulos:
  - H2: Instalar
  - H2: O que você recebe
  - H3: Operações básicas
  - H3: Acesso ao contêiner
  - H3: UI web e pareamento
  - H3: Configuração e manutenção
  - H3: Utilitários
  - H2: Fluxo da primeira vez
  - H2: Configuração e segredos
  - H2: Relacionado

## install/development-channels.md

- Rota: /install/development-channels
- Títulos:
  - H2: Alternar canais
  - H2: Direcionamento pontual para versão ou tag
  - H2: Execução de teste
  - H2: Plugins e canais
  - H2: Verificar status atual
  - H2: Boas práticas de marcação
  - H2: Disponibilidade do app macOS
  - H2: Relacionado

## install/digitalocean.md

- Rota: /install/digitalocean
- Títulos:
  - H2: Pré-requisitos
  - H2: Configuração
  - H2: Persistência e backups
  - H2: Dicas para 1 GB de RAM
  - H2: Solução de problemas
  - H2: Próximas etapas
  - H2: Relacionado

## install/docker-vm-runtime.md

- Rota: /install/docker-vm-runtime
- Títulos:
  - H2: Inclua os binários necessários na imagem
  - H2: Criar e iniciar
  - H2: O que persiste onde
  - H2: Atualizações
  - H2: Relacionado

## install/docker.md

- Rota: /install/docker
- Títulos:
  - H2: Docker é adequado para mim?
  - H2: Pré-requisitos
  - H2: Gateway em contêiner
  - H3: Fluxo manual
  - H3: Variáveis de ambiente
  - H3: Observabilidade
  - H3: Health checks
  - H3: LAN vs loopback
  - H3: Provedores locais do host
  - H3: Backend Claude CLI no Docker
  - H3: Bonjour / mDNS
  - H3: Armazenamento e persistência
  - H3: Helpers de shell (opcional)
  - H3: Executando em uma VPS?
  - H2: Sandbox do agente
  - H3: Ativação rápida
  - H2: Solução de problemas
  - H2: Relacionado

## install/exe-dev.md

- Rota: /install/exe-dev
- Títulos:
  - H2: Caminho rápido para iniciantes
  - H2: O que você precisa
  - H2: Instalação automatizada com Shelley
  - H2: Instalação manual
  - H2: 1) Criar a VM
  - H2: 2) Instalar pré-requisitos (na VM)
  - H2: 3) Instalar OpenClaw
  - H2: 4) Configurar nginx para fazer proxy do OpenClaw para a porta 8000
  - H2: 5) Acessar o OpenClaw e conceder privilégios
  - H2: Configuração de canal remoto
  - H2: Acesso remoto
  - H2: Atualizando
  - H2: Relacionado

## install/fly.md

- Rota: /install/fly
- Títulos:
  - H2: O que você precisa
  - H2: Caminho rápido para iniciantes
  - H2: Solução de problemas
  - H3: "App não está escutando no endereço esperado"
  - H3: Health checks falhando / conexão recusada
  - H3: OOM / problemas de memória
  - H3: Problemas de lock do Gateway
  - H3: Configuração não está sendo lida
  - H3: Gravando configuração via SSH
  - H3: Estado não persiste
  - H2: Atualizações
  - H3: Comando de atualização de máquina
  - H2: Implantação privada (reforçada)
  - H3: Quando usar implantação privada
  - H3: Configuração
  - H3: Acessar uma implantação privada
  - H3: Webhooks com implantação privada
  - H3: Benefícios de segurança
  - H2: Observações
  - H2: Custo
  - H2: Próximas etapas
  - H2: Relacionado

## install/gcp.md

- Rota: /install/gcp
- Títulos:
  - H2: O que estamos fazendo (em termos simples)?
  - H2: Caminho rápido (operadores experientes)
  - H2: O que você precisa
  - H2: Solução de problemas
  - H2: Contas de serviço (boa prática de segurança)
  - H2: Próximas etapas
  - H2: Relacionado

## install/hetzner.md

- Rota: /install/hetzner
- Títulos:
  - H2: Objetivo
  - H2: O que estamos fazendo (em termos simples)?
  - H2: Caminho rápido (operadores experientes)
  - H2: O que você precisa
  - H2: Infraestrutura como código (Terraform)
  - H2: Próximas etapas
  - H2: Relacionado

## install/hostinger.md

- Rota: /install/hostinger
- Títulos:
  - H2: Pré-requisitos
  - H2: Opção A: OpenClaw em 1 clique
  - H2: Opção B: OpenClaw em VPS
  - H2: Verificar sua configuração
  - H2: Solução de problemas
  - H2: Próximas etapas
  - H2: Relacionado

## install/index.md

- Rota: /install
- Títulos:
  - H2: Requisitos do sistema
  - H2: Recomendado: script instalador
  - H2: Métodos alternativos de instalação
  - H3: Instalador de prefixo local (install-cli.sh)
  - H3: npm, pnpm ou bun
  - H3: A partir do código-fonte
  - H3: Instalar a partir do checkout main do GitHub
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
  - H3: Detecção de checkout de origem
  - H3: Exemplos (install.sh)
  - H2: install-cli.sh
  - H3: Fluxo (install-cli.sh)
  - H3: Exemplos (install-cli.sh)
  - H2: install.ps1
  - H3: Fluxo (install.ps1)
  - H3: Exemplos (install.ps1)
  - H2: CI e automação
  - H2: Solução de problemas
  - H2: Relacionado

## install/kubernetes.md

- Rota: /install/kubernetes
- Títulos:
  - H2: Por que não Helm?
  - H2: O que você precisa
  - H2: Início rápido
  - H2: Testes locais com Kind
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
  - H3: Expor além de port-forward
  - H2: Reimplantar
  - H2: Desmontagem
  - H2: Notas de arquitetura
  - H2: Estrutura de arquivos
  - H2: Relacionado

## install/macos-vm.md

- Rota: /install/macos-vm
- Títulos:
  - H2: Padrão recomendado (maioria dos usuários)
  - H2: Opções de VM macOS
  - H3: VM local no seu Mac Apple Silicon (Lume)
  - H3: Provedores Mac hospedados (nuvem)
  - H2: Caminho rápido (Lume, usuários experientes)
  - H2: O que você precisa (Lume)
  - H2: 1) Instalar Lume
  - H2: 2) Criar a VM macOS
  - H2: 3) Concluir o Assistente de Configuração
  - H2: 4) Obter o endereço IP da VM
  - H2: 5) Fazer SSH na VM
  - H2: 6) Instalar OpenClaw
  - H2: 7) Configurar canais
  - H2: 8) Executar a VM sem interface
  - H2: Bônus: integração com iMessage
  - H2: Salvar uma imagem dourada
  - H2: Executando 24/7
  - H2: Solução de problemas
  - H2: Documentos relacionados

## install/migrating-claude.md

- Rota: /install/migrating-claude
- Títulos:
  - H2: Duas formas de importar
  - H2: O que é importado
  - H2: O que permanece apenas no arquivo
  - H2: Seleção de origem
  - H2: Fluxo recomendado
  - H2: Tratamento de conflitos
  - H2: Saída JSON para automação
  - H2: Solução de problemas
  - H2: Relacionado

## install/migrating-hermes.md

- Rota: /install/migrating-hermes
- Títulos:
  - H2: Duas formas de importar
  - H2: O que é importado
  - H2: O que permanece apenas no arquivo
  - H2: Fluxo recomendado
  - H2: Tratamento de conflitos
  - H2: Segredos
  - H2: Saída JSON para automação
  - H2: Solução de problemas
  - H2: Relacionado

## install/migrating.md

- Rota: /install/migrating
- Títulos:
  - H2: Importar de outro sistema de agentes
  - H2: Mover OpenClaw para uma nova máquina
  - H3: Etapas de migração
  - H3: Armadilhas comuns
  - H3: Checklist de verificação
  - H2: Atualizar um Plugin no lugar
  - H2: Relacionado

## install/nix.md

- Rota: /install/nix
- Títulos:
  - H2: O que você recebe
  - H2: Início rápido
  - H2: Comportamento de runtime no modo Nix
  - H3: O que muda no modo Nix
  - H3: Caminhos de configuração e estado
  - H3: Descoberta de PATH do serviço
  - H2: Relacionado

## install/node.md

- Rota: /install/node
- Títulos:
  - H2: Verifique sua versão
  - H2: Instalar Node
  - H2: Solução de problemas
  - H3: openclaw: comando não encontrado
  - H3: Erros de permissão em npm install -g (Linux)
  - H2: Relacionado

## install/northflank.mdx

- Rota: /install/northflank
- Títulos:
  - H1: Northflank
  - H2: Como começar
  - H2: O que você recebe
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
  - H2: Fallback: túnel SSH
  - H2: Solução de problemas
  - H2: Próximas etapas
  - H2: Relacionado

## install/podman.md

- Rota: /install/podman
- Títulos:
  - H2: Pré-requisitos
  - H2: Início rápido
  - H2: Podman e Tailscale
  - H2: Systemd (Quadlet, opcional)
  - H2: Configuração, env e armazenamento
  - H2: Comandos úteis
  - H2: Solução de problemas
  - H2: Relacionado

## install/railway.mdx

- Rota: /install/railway
- Títulos:
  - H1: Railway
  - H2: Checklist rápido (novos usuários)
  - H2: Implantação em um clique
  - H2: O que você recebe
  - H2: Configurações obrigatórias da Railway
  - H3: Rede pública
  - H3: Volume (obrigatório)
  - H3: Variáveis
  - H2: Conectar um canal
  - H2: Backups &amp; migração
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
  - H2: Relacionado

## install/render.mdx

- Rota: /install/render
- Títulos:
  - H1: Render
  - H2: Pré-requisitos
  - H2: Implante com um Blueprint do Render
  - H2: Entendendo o Blueprint
  - H2: Escolhendo um plano
  - H2: Após a implantação
  - H3: Acesse a Control UI
  - H2: Recursos do Render Dashboard
  - H3: Logs
  - H3: Acesso ao shell
  - H3: Variáveis de ambiente
  - H3: Implantação automática
  - H2: Domínio personalizado
  - H2: Escalabilidade
  - H2: Backups e migração
  - H2: Solução de problemas
  - H3: O serviço não inicia
  - H3: Inicializações a frio lentas (camada gratuita)
  - H3: Perda de dados após reimplantar
  - H3: Falhas na verificação de integridade
  - H2: Próximas etapas

## install/uninstall.md

- Rota: /install/uninstall
- Títulos:
  - H2: Caminho fácil (CLI ainda instalada)
  - H2: Remoção manual do serviço (CLI não instalada)
  - H3: macOS (launchd)
  - H3: Linux (unidade de usuário systemd)
  - H3: Windows (Tarefa Agendada)
  - H2: Instalação normal versus checkout do código-fonte
  - H3: Instalação normal (install.sh / npm / pnpm / bun)
  - H3: Checkout do código-fonte (git clone)
  - H2: Relacionado

## install/updating.md

- Rota: /install/updating
- Títulos:
  - H2: Recomendado: openclaw update
  - H2: Alternar entre instalações npm e git
  - H2: Alternativa: execute novamente o instalador
  - H2: Alternativa: npm, pnpm ou bun manual
  - H3: Tópicos avançados de instalação npm
  - H2: Atualizador automático
  - H2: Após atualizar
  - H3: Execute doctor
  - H3: Reinicie o Gateway
  - H3: Verificar
  - H2: Reversão
  - H3: Fixar uma versão (npm)
  - H3: Fixar um commit (código-fonte)
  - H2: Se você estiver travado
  - H2: Relacionado

## install/upstash.md

- Rota: /install/upstash
- Títulos:
  - H2: Pré-requisitos
  - H2: Crie uma Box
  - H2: Conecte com um túnel SSH
  - H2: Instale o OpenClaw
  - H2: Execute o onboarding
  - H2: Inicie o Gateway
  - H2: Reinício automático
  - H2: Solução de problemas
  - H2: Relacionado

## logging.md

- Rota: /logging
- Títulos:
  - H2: Onde os logs ficam
  - H2: Como ler logs
  - H3: CLI: acompanhamento ao vivo (recomendado)
  - H3: Control UI (web)
  - H3: Logs apenas de canal
  - H2: Formatos de log
  - H3: Logs de arquivo (JSONL)
  - H3: Saída do console
  - H3: Logs de WebSocket do Gateway
  - H2: Configurando logs
  - H3: Níveis de log
  - H3: Diagnósticos direcionados de transporte de modelo
  - H3: Correlação de rastreamento
  - H3: Tamanho e tempo de chamada de modelo
  - H3: Estilos do console
  - H3: Redação
  - H2: Diagnósticos e OpenTelemetry
  - H2: Dicas de solução de problemas
  - H2: Relacionado

## maturity/scorecard.md

- Rota: /maturity/scorecard
- Títulos:
  - H1: Cartão de pontuação de maturidade
  - H2: Para que serve esta página
  - H2: Visão geral
  - H2: Faixas de pontuação
  - H2: Explorador de superfície
  - H2: Resumo de evidências de QA
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
  - H2: Pareamento + identidade
  - H2: Descoberta + transportes
  - H2: Nós + transportes
  - H2: Segurança
  - H2: Relacionado

## nodes/audio.md

- Rota: /nodes/audio
- Títulos:
  - H2: O que funciona
  - H2: Detecção automática (padrão)
  - H2: Exemplos de configuração
  - H3: Fallback de provedor + CLI (OpenAI + Whisper CLI)
  - H3: Somente provedor com controle por escopo
  - H3: Somente provedor (Deepgram)
  - H3: Somente provedor (Mistral Voxtral)
  - H3: Somente provedor (SenseAudio)
  - H3: Ecoar transcrição no chat (opt-in)
  - H2: Observações e limites
  - H3: Suporte a ambiente de proxy
  - H2: Detecção de menções em grupos
  - H2: Armadilhas
  - H2: Relacionado

## nodes/camera.md

- Rota: /nodes/camera
- Títulos:
  - H2: Nó iOS
  - H3: Configuração do usuário (ativada por padrão)
  - H3: Comandos (via Gateway node.invoke)
  - H3: Requisito de primeiro plano
  - H3: Auxiliar da CLI
  - H2: Nó Android
  - H3: Configuração do usuário Android (ativada por padrão)
  - H3: Permissões
  - H3: Requisito de primeiro plano no Android
  - H3: Comandos Android (via Gateway node.invoke)
  - H3: Proteção de payload
  - H2: Aplicativo macOS
  - H3: Configuração do usuário (desativada por padrão)
  - H3: Auxiliar da CLI (invocação de nó)
  - H2: Segurança + limites práticos
  - H2: Vídeo de tela do macOS (nível do SO)
  - H2: Relacionado

## nodes/images.md

- Rota: /nodes/images
- Títulos:
  - H2: Objetivos
  - H2: Superfície de CLI
  - H2: Comportamento do canal WhatsApp Web
  - H2: Pipeline de resposta automática
  - H2: Mídia recebida para comandos
  - H2: Limites e erros
  - H2: Observações para testes
  - H2: Relacionado

## nodes/index.md

- Rota: /nodes
- Títulos:
  - H2: Pareamento + status
  - H2: Host de nó remoto (system.run)
  - H3: O que executa onde
  - H3: Inicie um host de nó (primeiro plano)
  - H3: Gateway remoto via túnel SSH (vínculo de loopback)
  - H3: Inicie um host de nó (serviço)
  - H3: Parear + nomear
  - H3: Coloque os comandos na lista de permissões
  - H3: Aponte exec para o nó
  - H3: Inferência de modelo local
  - H2: Invocando comandos
  - H2: Política de comandos
  - H2: Configuração (openclaw.json)
  - H2: Capturas de tela (snapshots de canvas)
  - H3: Controles do Canvas
  - H3: A2UI (Canvas)
  - H2: Fotos + vídeos (câmera do nó)
  - H2: Gravações de tela (nós)
  - H2: Localização (nós)
  - H2: SMS (nós Android)
  - H2: Comandos de dispositivo Android + dados pessoais
  - H2: Comandos do sistema (host de nó / nó Mac)
  - H2: Vínculo de nó exec
  - H2: Mapa de permissões
  - H2: Host de nó headless (multiplataforma)
  - H2: Modo de nó Mac

## nodes/location-command.md

- Rota: /nodes/location-command
- Títulos:
  - H2: TL;DR
  - H2: Por que um seletor (não apenas uma chave)
  - H2: Modelo de configurações
  - H2: Mapeamento de permissões (node.permissions)
  - H2: Comando: location.get
  - H2: Comportamento em segundo plano
  - H2: Integração de modelo/ferramentas
  - H2: Texto de UX (sugerido)
  - H2: Relacionado

## nodes/media-understanding.md

- Rota: /nodes/media-understanding
- Títulos:
  - H2: Objetivos
  - H2: Comportamento de alto nível
  - H2: Visão geral da configuração
  - H3: Entradas de modelo
  - H3: Credenciais do provedor (apiKey)
  - H2: Padrões e limites
  - H3: Detectar automaticamente compreensão de mídia (padrão)
  - H3: Suporte a ambiente de proxy (modelos de provedor)
  - H2: Recursos (opcional)
  - H2: Matriz de suporte de provedores (integrações OpenClaw)
  - H2: Orientação de seleção de modelo
  - H2: Política de anexos
  - H2: Exemplos de configuração
  - H2: Saída de status
  - H2: Observações
  - H2: Relacionado

## nodes/talk.md

- Rota: /nodes/talk
- Títulos:
  - H2: Comportamento (macOS)
  - H2: Diretivas de voz nas respostas
  - H2: Configuração (/.openclaw/openclaw.json)
  - H2: UI do macOS
  - H2: UI do Android
  - H2: Observações
  - H2: Relacionado

## nodes/troubleshooting.md

- Rota: /nodes/troubleshooting
- Títulos:
  - H2: Escada de comandos
  - H2: Requisitos de primeiro plano
  - H2: Matriz de permissões
  - H2: Pareamento versus aprovações
  - H2: Códigos de erro comuns de nó
  - H2: Ciclo rápido de recuperação
  - H2: Relacionado

## nodes/voicewake.md

- Rota: /nodes/voicewake
- Títulos:
  - H2: Armazenamento (host do Gateway)
  - H2: Protocolo
  - H3: Métodos
  - H3: Métodos de roteamento (acionador → destino)
  - H3: Eventos
  - H2: Comportamento do cliente
  - H3: Aplicativo macOS
  - H3: Nó iOS
  - H3: Nó Android
  - H2: Relacionado

## openclaw-agent-runtime.md

- Rota: /openclaw-agent-runtime
- Títulos:
  - H2: Verificação de tipos e linting
  - H2: Executando testes do Agent Runtime
  - H2: Teste manual
  - H2: Redefinição completa
  - H2: Referências
  - H2: Relacionado

## perplexity.md

- Rota: /perplexity
- Títulos:
  - H2: Relacionado

## plan/codex-context-engine-harness.md

- Rota: /plan/codex-context-engine-harness
- Títulos:
  - H2: Status
  - H2: Objetivo
  - H2: Não objetivos
  - H2: Arquitetura atual
  - H2: Lacuna atual
  - H2: Comportamento desejado
  - H2: Restrições de design
  - H3: O app-server do Codex permanece canônico para o estado nativo de threads
  - H3: A montagem do mecanismo de contexto deve ser projetada nas entradas do Codex
  - H3: A estabilidade do cache de prompt importa
  - H3: A semântica de seleção de runtime não muda
  - H2: Plano de implementação
  - H3: 1. Exportar ou realocar auxiliares reutilizáveis de tentativas do mecanismo de contexto
  - H3: 2. Adicionar um auxiliar de projeção de contexto do Codex
  - H3: 3. Conectar o bootstrap antes da inicialização da thread do Codex
  - H3: 4. Conectar assemble antes de thread/start / thread/resume e turn/start
  - H3: 5. Preservar a formatação estável do cache de prompt
  - H3: 6. Conectar post-turn após o espelhamento da transcrição
  - H3: 7. Normalizar uso e contexto de runtime do cache de prompt
  - H3: 8. Política de Compaction
  - H4: /compact e Compaction explícita do OpenClaw
  - H4: Eventos contextCompaction nativos do Codex durante o turno
  - H3: 9. Redefinição de sessão e comportamento de vínculo
  - H3: 10. Tratamento de erros
  - H2: Plano de teste
  - H3: Testes unitários
  - H3: Testes existentes a atualizar
  - H3: Testes de integração / ao vivo
  - H2: Observabilidade
  - H2: Migração / compatibilidade
  - H2: Perguntas em aberto
  - H2: Critérios de aceitação

## plan/ui-channels.md

- Rota: /plan/ui-channels
- Títulos:
  - H2: Status
  - H2: Problema
  - H2: Objetivos
  - H2: Não objetivos
  - H2: Modelo-alvo
  - H2: Metadados de entrega
  - H2: Contrato de capacidade de runtime
  - H2: Mapeamento de canais
  - H2: Etapas de refatoração
  - H2: Testes
  - H2: Perguntas em aberto
  - H2: Relacionado

## platforms/android.md

- Rota: /platforms/android
- Títulos:
  - H2: Resumo de suporte
  - H2: Controle do sistema
  - H2: Runbook de conexão
  - H3: Pré-requisitos
  - H3: 1) Inicie o Gateway
  - H3: 2) Verifique a descoberta (opcional)
  - H4: Descoberta de Tailnet (Viena ⇄ Londres) via DNS-SD unicast
  - H3: 3) Conectar do Android
  - H3: Beacons de presença ativa
  - H3: 4) Aprovar pareamento (CLI)
  - H3: 5) Verificar se o nó está conectado
  - H3: 6) Chat + histórico
  - H3: 7) Canvas + câmera
  - H4: Host do Gateway Canvas (recomendado para conteúdo web)
  - H3: 8) Voz + superfície expandida de comandos Android
  - H2: Pontos de entrada do assistente
  - H2: Encaminhamento de notificações
  - H2: Relacionado

## platforms/digitalocean.md

- Rota: /platforms/digitalocean
- Títulos:
  - H2: Relacionado

## platforms/easyrunner.md

- Rota: /platforms/easyrunner
- Títulos:
  - H2: Antes de começar
  - H2: Aplicativo Compose
  - H2: Configure o OpenClaw
  - H2: Verificar
  - H2: Atualizações e backups
  - H2: Solução de problemas

## platforms/index.md

- Rota: /platforms
- Títulos:
  - H2: Escolha seu SO
  - H2: VPS e hospedagem
  - H2: Links comuns
  - H2: Instalação do serviço Gateway (CLI)
  - H2: Relacionado

## platforms/ios.md

- Rota: /platforms/ios
- Títulos:
  - H2: O que ele faz
  - H2: Requisitos
  - H2: Início rápido (parear + conectar)
  - H2: Push com suporte de relay para builds oficiais
  - H2: Beacons de atividade em segundo plano
  - H2: Fluxo de autenticação e confiança
  - H2: Caminhos de descoberta
  - H3: Bonjour (LAN)
  - H3: Tailnet (entre redes)
  - H3: Host/porta manual
  - H2: Canvas + A2UI
  - H2: Relação com Computer Use
  - H3: Avaliação / snapshot de Canvas
  - H2: Ativação por voz + modo de fala
  - H2: Erros comuns
  - H2: Documentos relacionados

## platforms/linux.md

- Rota: /platforms/linux
- Títulos:
  - H2: Caminho rápido para iniciantes (VPS)
  - H2: Instalar
  - H2: Gateway
  - H2: Instalação do serviço Gateway (CLI)
  - H2: Controle do sistema (unidade de usuário systemd)
  - H2: Pressão de memória e encerramentos por OOM
  - H2: Relacionado

## platforms/mac/bundled-gateway.md

- Rota: /platforms/mac/bundled-gateway
- Títulos:
  - H2: Instale a CLI (necessário para o modo local)
  - H2: Launchd (Gateway como LaunchAgent)
  - H2: Compatibilidade de versões
  - H2: Diretório de estado no macOS
  - H2: Depurar conectividade do aplicativo
  - H2: Verificação smoke
  - H2: Relacionado

## platforms/mac/canvas.md

- Rota: /platforms/mac/canvas
- Títulos:
  - H2: Onde o Canvas fica
  - H2: Comportamento do painel
  - H2: Superfície da API do agente
  - H2: A2UI no Canvas
  - H3: Comandos A2UI (v0.8)
  - H2: Acionando execuções de agentes pelo Canvas
  - H2: Observações de segurança
  - H2: Relacionado

## platforms/mac/child-process.md

- Rota: /platforms/mac/child-process
- Títulos:
  - H2: Comportamento padrão (launchd)
  - H2: Builds de desenvolvimento não assinadas
  - H2: Modo somente anexação
  - H2: Modo remoto
  - H2: Por que preferimos launchd
  - H2: Relacionado

## platforms/mac/dev-setup.md

- Rota: /platforms/mac/dev-setup
- Títulos:
  - H1: configuração de desenvolvedor no macOS
  - H2: Pré-requisitos
  - H2: 1. Instalar dependências
  - H2: 2. Compilar e empacotar o app
  - H2: 3. Instalar a CLI
  - H2: Solução de problemas
  - H3: Falha na compilação: incompatibilidade de cadeia de ferramentas ou SDK
  - H3: O app falha ao conceder permissão
  - H3: Gateway "Iniciando..." indefinidamente
  - H2: Relacionado

## platforms/mac/health.md

- Rota: /platforms/mac/health
- Títulos:
  - H1: Verificações de integridade no macOS
  - H2: Barra de menus
  - H2: Configurações
  - H2: Como a sondagem funciona
  - H2: Em caso de dúvida
  - H2: Relacionado

## platforms/mac/icon.md

- Rota: /platforms/mac/icon
- Títulos:
  - H1: Estados do ícone da barra de menus
  - H2: Relacionado

## platforms/mac/logging.md

- Rota: /platforms/mac/logging
- Títulos:
  - H1: Registro de logs (macOS)
  - H2: Log de arquivo de diagnósticos rotativo (painel Depuração)
  - H2: Dados privados do registro unificado no macOS
  - H2: Habilitar para OpenClaw (ai.openclaw)
  - H2: Desabilitar após a depuração
  - H2: Relacionado

## platforms/mac/menu-bar.md

- Rota: /platforms/mac/menu-bar
- Títulos:
  - H2: O que é mostrado
  - H2: Modelo de estado
  - H2: Enum IconState (Swift)
  - H3: ActivityKind → glifo
  - H3: Mapeamento visual
  - H2: Submenu de contexto
  - H2: Texto da linha de status (menu)
  - H2: Ingestão de eventos
  - H2: Substituição de depuração
  - H2: Lista de verificação de testes
  - H2: Relacionado

## platforms/mac/peekaboo.md

- Rota: /platforms/mac/peekaboo
- Títulos:
  - H2: O que isto é (e não é)
  - H2: Relação com o uso do computador
  - H2: Habilitar a ponte
  - H2: Ordem de descoberta do cliente
  - H2: Segurança e permissões
  - H2: Comportamento de snapshot (automação)
  - H2: Solução de problemas
  - H2: Relacionado

## platforms/mac/permissions.md

- Rota: /platforms/mac/permissions
- Títulos:
  - H2: Requisitos para permissões estáveis
  - H2: Concessões de acessibilidade para runtimes Node e CLI
  - H2: Lista de verificação de recuperação quando os prompts desaparecem
  - H2: Permissões de arquivos e pastas (Mesa/Documentos/Downloads)
  - H2: Relacionado

## platforms/mac/remote.md

- Rota: /platforms/mac/remote
- Títulos:
  - H2: Modos
  - H2: Transportes remotos
  - H2: Pré-requisitos no host remoto
  - H2: Configuração do app macOS
  - H2: Chat na web
  - H2: Permissões
  - H2: Notas de segurança
  - H2: Fluxo de login do WhatsApp (remoto)
  - H2: Solução de problemas
  - H2: Sons de notificação
  - H2: Relacionado

## platforms/mac/signing.md

- Rota: /platforms/mac/signing
- Títulos:
  - H1: assinatura para mac (builds de depuração)
  - H2: Uso
  - H3: Nota sobre assinatura ad-hoc
  - H2: Metadados de build para Sobre
  - H2: Por quê
  - H2: Relacionado

## platforms/mac/skills.md

- Rota: /platforms/mac/skills
- Títulos:
  - H2: Fonte de dados
  - H2: Ações de instalação
  - H2: Chaves de ambiente/API
  - H2: Modo remoto
  - H2: Relacionado

## platforms/mac/voice-overlay.md

- Rota: /platforms/mac/voice-overlay
- Títulos:
  - H1: Ciclo de vida da sobreposição de voz (macOS)
  - H2: Intenção atual
  - H2: Implementado (9 de dezembro de 2025)
  - H2: Próximas etapas
  - H2: Lista de verificação de depuração
  - H2: Etapas de migração (sugeridas)
  - H2: Relacionado

## platforms/mac/voicewake.md

- Rota: /platforms/mac/voicewake
- Títulos:
  - H1: Ativação por voz &amp; push-to-talk
  - H2: Requisitos
  - H2: Modos
  - H2: Comportamento em runtime (palavra de ativação)
  - H2: Invariantes do ciclo de vida
  - H2: Modo de falha de sobreposição fixa (anterior)
  - H2: Especificidades do push-to-talk
  - H2: Configurações voltadas ao usuário
  - H2: Comportamento de encaminhamento
  - H2: Payload de encaminhamento
  - H2: Verificação rápida
  - H2: Relacionado

## platforms/mac/webchat.md

- Rota: /platforms/mac/webchat
- Títulos:
  - H2: Inicialização e depuração
  - H2: Como ele é conectado
  - H2: Superfície de segurança
  - H2: Limitações conhecidas
  - H2: Relacionado

## platforms/mac/xpc.md

- Rota: /platforms/mac/xpc
- Títulos:
  - H1: Arquitetura IPC do OpenClaw para macOS
  - H2: Objetivos
  - H2: Como funciona
  - H3: Gateway + transporte Node
  - H3: Serviço Node + IPC do app
  - H3: PeekabooBridge (automação de UI)
  - H2: Fluxos operacionais
  - H2: Notas de reforço
  - H2: Relacionado

## platforms/macos.md

- Rota: /platforms/macos
- Títulos:
  - H2: Download
  - H2: Primeira execução
  - H2: Escolher um modo de Gateway
  - H2: O que o app controla
  - H2: Páginas de detalhes do macOS
  - H2: Relacionado

## platforms/oracle.md

- Rota: /platforms/oracle
- Títulos:
  - H2: Relacionado

## platforms/raspberry-pi.md

- Rota: /platforms/raspberry-pi
- Títulos:
  - H2: Relacionado

## platforms/windows.md

- Rota: /platforms/windows
- Títulos:
  - H2: Recomendado: Windows Hub
  - H3: O que o Windows Hub inclui
  - H3: Primeira inicialização
  - H2: Modo de nó do Windows
  - H2: Modo MCP local
  - H2: CLI e Gateway nativos do Windows
  - H2: Gateway WSL2
  - H2: Inicialização automática do Gateway antes do login no Windows
  - H2: Expor serviços WSL pela LAN
  - H2: Solução de problemas
  - H3: O ícone da bandeja não aparece
  - H3: A configuração local falha
  - H3: O app diz que o pareamento é necessário
  - H3: O chat na web não consegue alcançar um Gateway remoto
  - H3: Comandos screen.snapshot, camera ou audio falham
  - H3: A conectividade com Git ou GitHub falha
  - H2: Relacionado

## plugins/adding-capabilities.md

- Rota: /plugins/adding-capabilities
- Títulos:
  - H2: Quando criar uma capacidade
  - H2: A sequência padrão
  - H2: O que fica onde
  - H2: Limites entre provedor e harness
  - H2: Lista de verificação de arquivos
  - H2: Exemplo completo: geração de imagens
  - H2: Provedores de embeddings
  - H2: Lista de verificação de revisão
  - H2: Relacionado

## plugins/admin-http-rpc.md

- Rota: /plugins/admin-http-rpc
- Títulos:
  - H2: Antes de habilitar
  - H2: Habilitar
  - H2: Verificar a rota
  - H2: Autenticação
  - H2: Modelo de segurança
  - H2: Solicitação
  - H2: Resposta
  - H2: Métodos permitidos
  - H2: Comparação com WebSocket
  - H2: Solução de problemas
  - H2: Relacionado

## plugins/agent-tools.md

- Rota: /plugins/agent-tools
- Títulos:
  - H2: Relacionado

## plugins/architecture-internals.md

- Rota: /plugins/architecture-internals
- Títulos:
  - H2: Pipeline de carregamento
  - H3: Comportamento com manifesto em primeiro lugar
  - H3: Limite do cache de Plugin
  - H2: Modelo de registro
  - H2: Callbacks de vinculação de conversas
  - H2: Hooks de runtime do provedor
  - H3: Ordem e uso dos hooks
  - H3: Exemplo de provedor
  - H3: Exemplos integrados
  - H2: Helpers de runtime
  - H3: api.runtime.imageGeneration
  - H2: Rotas HTTP do Gateway
  - H2: Caminhos de importação do SDK de Plugin
  - H2: Esquemas de ferramentas de mensagem
  - H2: Resolução de destino de canal
  - H2: Diretórios baseados em configuração
  - H2: Catálogos de provedores
  - H2: Inspeção de canal somente leitura
  - H2: Pacotes de package
  - H3: Metadados de catálogo de canais
  - H2: Plugins de mecanismo de contexto
  - H2: Adicionar uma nova capacidade
  - H3: Lista de verificação de capacidade
  - H3: Modelo de capacidade
  - H2: Relacionado

## plugins/architecture.md

- Rota: /plugins/architecture
- Títulos:
  - H2: Modelo público de capacidades
  - H3: Postura de compatibilidade externa
  - H3: Formatos de Plugin
  - H3: Hooks legados
  - H3: Sinais de compatibilidade
  - H2: Visão geral da arquitetura
  - H3: Snapshot de metadados de Plugin e tabela de consulta
  - H3: Planejamento de ativação
  - H3: Plugins de canal e a ferramenta de mensagens compartilhada
  - H2: Modelo de propriedade de capacidades
  - H3: Camadas de capacidade
  - H3: Exemplo de Plugin de empresa com várias capacidades
  - H3: Exemplo de capacidade: compreensão de vídeo
  - H2: Contratos e aplicação
  - H3: O que pertence a um contrato
  - H2: Modelo de execução
  - H2: Limite de exportação
  - H2: Internos e referência
  - H2: Relacionado

## plugins/building-extensions.md

- Rota: /plugins/building-extensions
- Títulos:
  - H2: Relacionado

## plugins/building-plugins.md

- Rota: /plugins/building-plugins
- Títulos:
  - H2: Requisitos
  - H2: Escolher o formato do Plugin
  - H2: Início rápido
  - H2: Registrar ferramentas
  - H2: Convenções de importação
  - H2: Lista de verificação antes do envio
  - H2: Testar contra versões beta
  - H2: Próximas etapas
  - H2: Relacionado

## plugins/bundles.md

- Rota: /plugins/bundles
- Títulos:
  - H2: Por que bundles existem
  - H2: Instalar um bundle
  - H2: O que o OpenClaw mapeia a partir de bundles
  - H3: Compatível agora
  - H4: Conteúdo de Skill
  - H4: Pacotes de hooks
  - H4: MCP para OpenClaw incorporado
  - H4: Configurações do OpenClaw incorporado
  - H4: LSP do OpenClaw incorporado
  - H3: Detectado, mas não executado
  - H2: Formatos de bundle
  - H2: Precedência de detecção
  - H2: Dependências de runtime e limpeza
  - H2: Segurança
  - H2: Solução de problemas
  - H2: Relacionado

## plugins/cli-backend-plugins.md

- Rota: /plugins/cli-backend-plugins
- Títulos:
  - H2: O que o Plugin controla
  - H2: Plugin de backend mínimo
  - H2: Formato de configuração
  - H2: Hooks avançados de backend
  - H3: ownsNativeCompaction: optar por não usar a Compaction do OpenClaw
  - H2: Ponte de ferramentas MCP
  - H2: Configuração do usuário
  - H2: Verificação
  - H2: Lista de verificação
  - H2: Relacionado

## plugins/codex-computer-use.md

- Rota: /plugins/codex-computer-use
- Títulos:
  - H2: OpenClaw.app e Peekaboo
  - H2: App iOS
  - H2: MCP cua-driver direto
  - H2: Configuração rápida
  - H2: Comandos
  - H2: Opções do marketplace
  - H2: Marketplace macOS incluído
  - H2: Limite do catálogo remoto
  - H2: Referência de configuração
  - H2: O que o OpenClaw verifica
  - H2: Permissões do macOS
  - H2: Solução de problemas
  - H2: Relacionado

## plugins/codex-harness-reference.md

- Rota: /plugins/codex-harness-reference
- Títulos:
  - H2: Superfície de configuração do Plugin
  - H2: Transporte de servidor de app
  - H2: Modos de aprovação e sandbox
  - H2: Execução nativa em sandbox
  - H2: Isolamento de autenticação e ambiente
  - H2: Ferramentas dinâmicas
  - H2: Timeouts
  - H2: Descoberta de modelos
  - H2: Arquivos de bootstrap do workspace
  - H2: Substituições de ambiente
  - H2: Relacionado

## plugins/codex-harness-runtime.md

- Rota: /plugins/codex-harness-runtime
- Títulos:
  - H2: Visão geral
  - H2: Vinculações de thread e alterações de modelo
  - H2: Respostas visíveis e heartbeats
  - H2: Limites de hooks
  - H2: Contrato de suporte V1
  - H2: Permissões nativas e elicitações MCP
  - H2: Direcionamento de fila
  - H2: Upload de feedback do Codex
  - H2: Compaction e espelho de transcrição
  - H2: Mídia e entrega
  - H2: Relacionado

## plugins/codex-harness.md

- Rota: /plugins/codex-harness
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Configuração
  - H2: Verificar runtime Codex
  - H2: Roteamento e seleção de modelo
  - H2: Padrões de implantação
  - H3: Implantação básica do Codex
  - H3: Implantação com provedores mistos
  - H3: Implantação Codex fail-closed
  - H2: Política de servidor de app
  - H2: Comandos e diagnósticos
  - H3: Inspecionar threads do Codex localmente
  - H2: Plugins nativos do Codex
  - H2: Uso do computador
  - H2: Limites de runtime
  - H2: Solução de problemas
  - H2: Relacionado

## plugins/codex-native-plugins.md

- Rota: /plugins/codex-native-plugins
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Gerenciar plugins pelo chat
  - H2: Como a configuração de Plugin nativo funciona
  - H2: Limite de suporte V1
  - H2: Inventário e propriedade do app
  - H2: Configuração de app da thread
  - H2: Política de ações destrutivas
  - H2: Solução de problemas
  - H2: Relacionado

## plugins/community.md

- Rota: /plugins/community
- Títulos:
  - H2: Encontrar plugins
  - H2: Publicar plugins
  - H2: Relacionado

## plugins/compatibility.md

- Rota: /plugins/compatibility
- Títulos:
  - H2: Registro de compatibilidade
  - H2: Pacote inspetor de Plugin
  - H3: Lane de aceitação do mantenedor
  - H2: Política de descontinuação
  - H2: Áreas atuais de compatibilidade
  - H3: Aliases planos de callback de entrada do WhatsApp
  - H3: Campos de admissão de entrada do WhatsApp
  - H2: Notas de versão

## plugins/copilot.md

- Rota: /plugins/copilot
- Títulos:
  - H2: Requisitos
  - H2: Instalação do Plugin
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H2: BYOK
  - H2: Autenticação
  - H2: Superfície de configuração
  - H2: Compaction
  - H2: Espelhamento de transcrição
  - H2: Perguntas paralelas (/btw)
  - H2: Doctor
  - H2: Limitações
  - H2: Permissões e askuser
  - H3: Token GitHub no nível da sessão
  - H2: Relacionado

## plugins/dependency-resolution.md

- Rota: /plugins/dependency-resolution
- Títulos:
  - H2: Divisão de responsabilidades
  - H2: Raízes de instalação
  - H2: Plugins locais
  - H2: Inicialização e recarregamento
  - H2: Plugins incluídos
  - H2: Limpeza legada

## plugins/google-meet.md

- Rota: /plugins/google-meet
- Cabeçalhos:
  - H2: Início rápido
  - H3: Gateway local + Chrome no Parallels
  - H2: Notas de instalação
  - H2: Transportes
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth e pré-verificação
  - H3: Crie credenciais do Google
  - H3: Emita o token de atualização
  - H3: Verifique OAuth com doctor
  - H2: Configuração
  - H2: Ferramenta
  - H2: Modos de agente e bidi
  - H2: Checklist de teste ao vivo
  - H2: Solução de problemas
  - H3: O agente não consegue ver a ferramenta do Google Meet
  - H3: Nenhum nó compatível com Google Meet conectado
  - H3: O navegador abre, mas o agente não consegue entrar
  - H3: Falha na criação da reunião
  - H3: O agente entra, mas não fala
  - H3: Falha nas verificações de configuração do Twilio
  - H3: A chamada do Twilio inicia, mas nunca entra na reunião
  - H2: Observações
  - H2: Relacionado

## plugins/hooks.md

- Rota: /plugins/hooks
- Cabeçalhos:
  - H2: Início rápido
  - H2: Catálogo de hooks
  - H2: Depurar hooks de runtime
  - H2: Política de chamada de ferramenta
  - H3: Hook de ambiente de execução
  - H3: Persistência de resultado de ferramenta
  - H2: Hooks de prompt e modelo
  - H3: Extensões de sessão e injeções no próximo turno
  - H2: Hooks de mensagem
  - H2: Hooks de instalação
  - H2: Ciclo de vida do Gateway
  - H2: Próximas descontinuações
  - H2: Relacionado

## plugins/install-overrides.md

- Rota: /plugins/install-overrides
- Cabeçalhos:
  - H2: Ambiente
  - H2: Comportamento
  - H2: E2E do pacote

## plugins/llama-cpp.md

- Rota: /plugins/llama-cpp
- Cabeçalhos:
  - H2: Configuração
  - H2: Runtime nativo

## plugins/manage-plugins.md

- Rota: /plugins/manage-plugins
- Cabeçalhos:
  - H2: Listar e pesquisar plugins
  - H2: Instalar plugins
  - H2: Reiniciar e inspecionar
  - H2: Atualizar plugins
  - H2: Desinstalar plugins
  - H2: Escolher uma fonte
  - H2: Publicar plugins
  - H2: Relacionado

## plugins/manifest.md

- Rota: /plugins/manifest
- Cabeçalhos:
  - H2: O que este arquivo faz
  - H2: Exemplo mínimo
  - H2: Exemplo completo
  - H2: Referência de campos de nível superior
  - H2: Referência de metadados do provedor de geração
  - H2: Referência de metadados de ferramenta
  - H2: Referência de providerAuthChoices
  - H2: Referência de commandAliases
  - H2: Referência de activation
  - H2: Referência de qaRunners
  - H2: Referência de setup
  - H3: Referência de setup.providers
  - H3: Campos de setup
  - H2: Referência de uiHints
  - H2: Referência de contracts
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
  - H2: Manifest versus package.json
  - H3: Campos de package.json que afetam a descoberta
  - H2: Precedência de descoberta (ids de Plugin duplicados)
  - H2: Requisitos do JSON Schema
  - H2: Comportamento de validação
  - H2: Observações
  - H2: Relacionado

## plugins/memory-lancedb.md

- Rota: /plugins/memory-lancedb
- Cabeçalhos:
  - H2: Instalação
  - H2: Início rápido
  - H2: Embeddings apoiados por provedor
  - H2: Embeddings do Ollama
  - H2: Provedores compatíveis com OpenAI
  - H2: Limites de recuperação e captura
  - H2: Comandos
  - H2: Armazenamento
  - H2: Dependências de runtime
  - H2: Solução de problemas
  - H3: O comprimento da entrada excede o comprimento do contexto
  - H3: Modelo de embedding sem suporte
  - H3: O Plugin carrega, mas nenhuma memória aparece
  - H2: Relacionado

## plugins/memory-wiki.md

- Rota: /plugins/memory-wiki
- Cabeçalhos:
  - H2: O que ele adiciona
  - H2: Como ele se integra à memória
  - H2: Padrão híbrido recomendado
  - H2: Modos do cofre
  - H3: isolado
  - H3: ponte
  - H3: local inseguro
  - H2: Layout do cofre
  - H2: Importações do Open Knowledge Format
  - H2: Declarações estruturadas e evidências
  - H2: Metadados de entidade voltados ao agente
  - H2: Pipeline de compilação
  - H2: Dashboards e relatórios de integridade
  - H2: Pesquisa e recuperação
  - H2: Ferramentas do agente
  - H2: Comportamento de prompt e contexto
  - H2: Configuração
  - H3: Exemplo: QMD + modo ponte
  - H2: CLI
  - H2: Suporte ao Obsidian
  - H2: Fluxo de trabalho recomendado
  - H2: Documentação relacionada

## plugins/message-presentation.md

- Rota: /plugins/message-presentation
- Cabeçalhos:
  - H2: Contrato
  - H2: Exemplos de produtores
  - H2: Contrato do renderizador
  - H2: Fluxo de renderização do core
  - H2: Regras de degradação
  - H3: Visibilidade do fallback de valor de botão
  - H2: Mapeamento de provedor
  - H2: Apresentação vs InteractiveReply
  - H2: Pin de entrega
  - H2: Checklist do autor do Plugin
  - H2: Documentação relacionada

## plugins/oc-path.md

- Rota: /plugins/oc-path
- Cabeçalhos:
  - H2: Por que habilitá-lo
  - H2: Onde ele é executado
  - H2: Habilitar
  - H2: Dependências
  - H2: O que ele fornece
  - H2: Relação com outros plugins
  - H2: Segurança
  - H2: Relacionado

## plugins/plugin-inventory.md

- Rota: /plugins/plugin-inventory
- Cabeçalhos:
  - H1: Inventário de Plugin
  - H2: Definições
  - H2: Instalar um Plugin
  - H2: Pacote npm do core
  - H2: Pacotes externos oficiais
  - H2: Apenas checkout do código-fonte

## plugins/plugin-permission-requests.md

- Rota: /plugins/plugin-permission-requests
- Cabeçalhos:
  - H2: Escolha o gate correto
  - H2: Solicitar aprovação antes de uma chamada de ferramenta
  - H2: Comportamento de decisão
  - H2: Encaminhar prompts de aprovação
  - H2: Permissões nativas do Codex
  - H2: Solução de problemas
  - H2: Relacionado

## plugins/reference.md

- Rota: /plugins/reference
- Cabeçalhos:
  - H1: Referência de Plugin

## plugins/reference/acpx.md

- Rota: /plugins/reference/acpx
- Cabeçalhos:
  - H1: Plugin ACPx
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/admin-http-rpc.md

- Rota: /plugins/reference/admin-http-rpc
- Cabeçalhos:
  - H1: Plugin Admin Http Rpc
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/alibaba.md

- Rota: /plugins/reference/alibaba
- Cabeçalhos:
  - H1: Plugin Alibaba
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/amazon-bedrock-mantle.md

- Rota: /plugins/reference/amazon-bedrock-mantle
- Cabeçalhos:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/amazon-bedrock.md

- Rota: /plugins/reference/amazon-bedrock
- Cabeçalhos:
  - H1: Plugin Amazon Bedrock
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/anthropic-vertex.md

- Rota: /plugins/reference/anthropic-vertex
- Cabeçalhos:
  - H1: Plugin Anthropic Vertex
  - H2: Distribuição
  - H2: Superfície
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Rota: /plugins/reference/anthropic
- Cabeçalhos:
  - H1: Plugin Anthropic
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/arcee.md

- Rota: /plugins/reference/arcee
- Cabeçalhos:
  - H1: Plugin Arcee
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/azure-speech.md

- Rota: /plugins/reference/azure-speech
- Cabeçalhos:
  - H1: Plugin Azure Speech
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/bonjour.md

- Rota: /plugins/reference/bonjour
- Cabeçalhos:
  - H1: Plugin Bonjour
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/brave.md

- Rota: /plugins/reference/brave
- Cabeçalhos:
  - H1: Plugin Brave
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/browser.md

- Rota: /plugins/reference/browser
- Cabeçalhos:
  - H1: Plugin Browser
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/byteplus.md

- Rota: /plugins/reference/byteplus
- Cabeçalhos:
  - H1: Plugin BytePlus
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/canvas.md

- Rota: /plugins/reference/canvas
- Cabeçalhos:
  - H1: Plugin Canvas
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/cerebras.md

- Rota: /plugins/reference/cerebras
- Cabeçalhos:
  - H1: Plugin Cerebras
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/chutes.md

- Rota: /plugins/reference/chutes
- Cabeçalhos:
  - H1: Plugin Chutes
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/clawrouter.md

- Rota: /plugins/reference/clawrouter
- Cabeçalhos:
  - H1: Plugin ClawRouter
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/clickclack.md

- Rota: /plugins/reference/clickclack
- Cabeçalhos:
  - H1: Plugin Clickclack
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/cloudflare-ai-gateway.md

- Rota: /plugins/reference/cloudflare-ai-gateway
- Cabeçalhos:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/codex-supervisor.md

- Rota: /plugins/reference/codex-supervisor
- Cabeçalhos:
  - H1: Plugin Codex Supervisor
  - H2: Distribuição
  - H2: Superfície
  - H2: Listagem de sessões

## plugins/reference/codex.md

- Rota: /plugins/reference/codex
- Cabeçalhos:
  - H1: Plugin Codex
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/cohere.md

- Rota: /plugins/reference/cohere
- Cabeçalhos:
  - H1: Plugin Cohere
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/comfy.md

- Rota: /plugins/reference/comfy
- Cabeçalhos:
  - H1: Plugin ComfyUI
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/copilot-proxy.md

- Rota: /plugins/reference/copilot-proxy
- Cabeçalhos:
  - H1: Plugin Copilot Proxy
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/copilot.md

- Rota: /plugins/reference/copilot
- Cabeçalhos:
  - H1: Plugin Copilot
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/deepgram.md

- Rota: /plugins/reference/deepgram
- Cabeçalhos:
  - H1: Plugin Deepgram
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/deepinfra.md

- Rota: /plugins/reference/deepinfra
- Cabeçalhos:
  - H1: Plugin DeepInfra
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/deepseek.md

- Rota: /plugins/reference/deepseek
- Cabeçalhos:
  - H1: Plugin DeepSeek
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/diagnostics-otel.md

- Rota: /plugins/reference/diagnostics-otel
- Cabeçalhos:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/diagnostics-prometheus.md

- Rota: /plugins/reference/diagnostics-prometheus
- Cabeçalhos:
  - H1: Plugin Diagnostics Prometheus
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/diffs-language-pack.md

- Rota: /plugins/reference/diffs-language-pack
- Cabeçalhos:
  - H1: Plugin Diffs Language Pack
  - H2: Distribuição
  - H2: Superfície
  - H2: Idiomas adicionados

## plugins/reference/diffs.md

- Rota: /plugins/reference/diffs
- Cabeçalhos:
  - H1: Plugin Diffs
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/discord.md

- Rota: /plugins/reference/discord
- Cabeçalhos:
  - H1: Plugin Discord
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/document-extract.md

- Rota: /plugins/reference/document-extract
- Cabeçalhos:
  - H1: Plugin Document Extract
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/duckduckgo.md

- Rota: /plugins/reference/duckduckgo
- Cabeçalhos:
  - H1: Plugin DuckDuckGo
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/elevenlabs.md

- Rota: /plugins/reference/elevenlabs
- Cabeçalhos:
  - H1: Plugin Elevenlabs
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/exa.md

- Rota: /plugins/reference/exa
- Cabeçalhos:
  - H1: Plugin Exa
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/fal.md

- Rota: /plugins/reference/fal
- Cabeçalhos:
  - H1: Plugin fal
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/feishu.md

- Rota: /plugins/reference/feishu
- Cabeçalhos:
  - H1: Plugin Feishu
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/file-transfer.md

- Rota: /plugins/reference/file-transfer
- Cabeçalhos:
  - H1: Plugin File Transfer
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
  - H1: Plugin LLM Task
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
  - H1: Plugin Memory Core
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/memory-lancedb.md

- Rota: /plugins/reference/memory-lancedb
- Títulos:
  - H1: Plugin Memory Lancedb
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/memory-wiki.md

- Rota: /plugins/reference/memory-wiki
- Títulos:
  - H1: Plugin Memory Wiki
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
  - H1: Plugin Migrate Claude
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/migrate-hermes.md

- Rota: /plugins/reference/migrate-hermes
- Títulos:
  - H1: Plugin Migrate Hermes
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
  - H1: Plugin Policy
  - H2: Distribuição
  - H2: Superfície
  - H2: Comportamento
  - H2: Documentação relacionada

## plugins/reference/qa-channel.md

- Rota: /plugins/reference/qa-channel
- Títulos:
  - H1: Plugin QA Channel
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/qa-lab.md

- Rota: /plugins/reference/qa-lab
- Títulos:
  - H1: Plugin QA Lab
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/qa-matrix.md

- Rota: /plugins/reference/qa-matrix
- Títulos:
  - H1: Plugin QA Matrix
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
  - H1: Plugin Sms
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
- Cabeçalhos:
  - H1: Plugin do Twitch
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/venice.md

- Rota: /plugins/reference/venice
- Cabeçalhos:
  - H1: Plugin do Venice
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/vercel-ai-gateway.md

- Rota: /plugins/reference/vercel-ai-gateway
- Cabeçalhos:
  - H1: Plugin do Vercel AI Gateway
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/vllm.md

- Rota: /plugins/reference/vllm
- Cabeçalhos:
  - H1: Plugin do vLLM
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/voice-call.md

- Rota: /plugins/reference/voice-call
- Cabeçalhos:
  - H1: Plugin de chamada de voz
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/volcengine.md

- Rota: /plugins/reference/volcengine
- Cabeçalhos:
  - H1: Plugin do Volcengine
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/voyage.md

- Rota: /plugins/reference/voyage
- Cabeçalhos:
  - H1: Plugin do Voyage
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/vydra.md

- Rota: /plugins/reference/vydra
- Cabeçalhos:
  - H1: Plugin do Vydra
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/web-readability.md

- Rota: /plugins/reference/web-readability
- Cabeçalhos:
  - H1: Plugin Web Readability
  - H2: Distribuição
  - H2: Superfície

## plugins/reference/webhooks.md

- Rota: /plugins/reference/webhooks
- Cabeçalhos:
  - H1: Plugin de Webhooks
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/whatsapp.md

- Rota: /plugins/reference/whatsapp
- Cabeçalhos:
  - H1: Plugin do WhatsApp
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/workboard.md

- Rota: /plugins/reference/workboard
- Cabeçalhos:
  - H1: Plugin do Workboard
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/xai.md

- Rota: /plugins/reference/xai
- Cabeçalhos:
  - H1: Plugin do xAI
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/xiaomi.md

- Rota: /plugins/reference/xiaomi
- Cabeçalhos:
  - H1: Plugin do Xiaomi
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/zai.md

- Rota: /plugins/reference/zai
- Cabeçalhos:
  - H1: Plugin do Z.AI
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/zalo.md

- Rota: /plugins/reference/zalo
- Cabeçalhos:
  - H1: Plugin do Zalo
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/reference/zalouser.md

- Rota: /plugins/reference/zalouser
- Cabeçalhos:
  - H1: Plugin Zalo Personal
  - H2: Distribuição
  - H2: Superfície
  - H2: Documentação relacionada

## plugins/sdk-agent-harness.md

- Rota: /plugins/sdk-agent-harness
- Cabeçalhos:
  - H2: Quando usar um harness
  - H2: O que o núcleo ainda controla
  - H2: Registrar um harness
  - H2: Política de seleção
  - H2: Pareamento de provedor e harness
  - H3: Middleware de resultado de ferramenta
  - H3: Classificação de resultado terminal
  - H3: Efeitos colaterais no fim do agente
  - H3: Entrada do usuário e superfícies de ferramentas
  - H3: Modo de harness nativo do Codex
  - H2: Rigor do runtime
  - H2: Sessões nativas e espelho de transcrição
  - H2: Resultados de ferramentas e mídia
  - H2: Limitações atuais
  - H2: Relacionado

## plugins/sdk-channel-inbound.md

- Rota: /plugins/sdk-channel-inbound
- Cabeçalhos:
  - H2: Auxiliares do núcleo
  - H2: Migração

## plugins/sdk-channel-ingress.md

- Rota: /plugins/sdk-channel-ingress
- Cabeçalhos:
  - H1: API de ingresso de canal
  - H2: Resolvedor de runtime
  - H2: Resultado
  - H2: Grupos de acesso
  - H2: Modos de evento
  - H2: Rotas e ativação
  - H2: Redação
  - H2: Verificação

## plugins/sdk-channel-message.md

- Rota: /plugins/sdk-channel-message
- Cabeçalhos: nenhum

## plugins/sdk-channel-outbound.md

- Rota: /plugins/sdk-channel-outbound
- Cabeçalhos:
  - H2: Adaptador
  - H2: Adaptadores de saída existentes
  - H2: Envios duráveis
  - H2: Despacho de compatibilidade

## plugins/sdk-channel-plugins.md

- Rota: /plugins/sdk-channel-plugins
- Cabeçalhos:
  - H2: Como os Plugins de canal funcionam
  - H2: Aprovações e capacidades de canal
  - H2: Política de menção de entrada
  - H2: Passo a passo
  - H2: Estrutura de arquivos
  - H2: Tópicos avançados
  - H2: Próximos passos
  - H2: Relacionado

## plugins/sdk-channel-turn.md

- Rota: /plugins/sdk-channel-turn
- Cabeçalhos: nenhum

## plugins/sdk-entrypoints.md

- Rota: /plugins/sdk-entrypoints
- Cabeçalhos:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Modo de registro
  - H2: Formatos de Plugin
  - H2: Relacionado

## plugins/sdk-migration.md

- Rota: /plugins/sdk-migration
- Cabeçalhos:
  - H2: O que está mudando
  - H2: Por que isso mudou
  - H2: Plano de migração de fala e voz em tempo real
  - H2: Política de compatibilidade
  - H2: Como migrar
  - H2: Referência de caminhos de importação
  - H2: Depreciações ativas
  - H2: Cronograma de remoção
  - H2: Suprimindo os avisos temporariamente
  - H2: Relacionado

## plugins/sdk-overview.md

- Rota: /plugins/sdk-overview
- Cabeçalhos:
  - H2: Convenção de importação
  - H2: Referência de subcaminhos
  - H2: API de registro
  - H3: Registro de capacidade
  - H3: Ferramentas e comandos
  - H3: Infraestrutura
  - H3: Hooks do host para Plugins de fluxo de trabalho
  - H3: Registro de descoberta do Gateway
  - H3: Metadados de registro da CLI
  - H3: Registro de backend da CLI
  - H3: Slots exclusivos
  - H3: Adaptadores de embedding de memória obsoletos
  - H3: Eventos e ciclo de vida
  - H3: Semântica de decisão de hooks
  - H3: Campos do objeto da API
  - H2: Convenção de módulos internos
  - H2: Relacionado

## plugins/sdk-provider-plugins.md

- Rota: /plugins/sdk-provider-plugins
- Cabeçalhos:
  - H2: Passo a passo
  - H2: Publicar no ClawHub
  - H2: Estrutura de arquivos
  - H2: Referência de ordem do catálogo
  - H2: Próximos passos
  - H2: Relacionado

## plugins/sdk-runtime.md

- Rota: /plugins/sdk-runtime
- Cabeçalhos:
  - H2: Carregamento e escritas de configuração
  - H2: Utilitários de runtime reutilizáveis
  - H2: Namespaces de runtime
  - H2: Armazenamento de referências de runtime
  - H2: Outros campos de API de nível superior
  - H2: Relacionado

## plugins/sdk-setup.md

- Rota: /plugins/sdk-setup
- Cabeçalhos:
  - H2: Metadados do pacote
  - H3: Campos de openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Carregamento completo adiado
  - H2: Manifesto do Plugin
  - H2: Publicação no ClawHub
  - H2: Entrada de configuração
  - H3: Importações restritas de auxiliares de configuração
  - H3: Promoção de conta única controlada pelo canal
  - H2: Esquema de configuração
  - H3: Criando esquemas de configuração de canal
  - H2: Assistentes de configuração
  - H2: Publicação e instalação
  - H2: Relacionado

## plugins/sdk-subpaths.md

- Rota: /plugins/sdk-subpaths
- Cabeçalhos:
  - H2: Entrada do Plugin
  - H3: Auxiliares de compatibilidade e teste obsoletos
  - H3: Subcaminhos auxiliares reservados para Plugins empacotados
  - H2: Relacionado

## plugins/sdk-testing.md

- Rota: /plugins/sdk-testing
- Cabeçalhos:
  - H2: Utilitários de teste
  - H3: Exportações disponíveis
  - H3: Tipos
  - H2: Testando a resolução de destino
  - H2: Padrões de teste
  - H3: Testando contratos de registro
  - H3: Testando acesso à configuração de runtime
  - H3: Teste unitário de um Plugin de canal
  - H3: Teste unitário de um Plugin de provedor
  - H3: Simulando o runtime de Plugin
  - H3: Testando com stubs por instância
  - H2: Testes de contrato (Plugins no repositório)
  - H3: Executando testes com escopo
  - H2: Aplicação de lint (Plugins no repositório)
  - H2: Configuração de teste
  - H2: Relacionado

## plugins/tool-plugins.md

- Rota: /plugins/tool-plugins
- Cabeçalhos:
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
  - H3: entrada do Plugin não encontrada: ./dist/index.js
  - H3: entrada do Plugin não expõe metadados de defineToolPlugin
  - H3: metadados gerados de openclaw.plugin.json estão desatualizados
  - H3: openclaw.extensions de package.json deve incluir ./dist/index.js
  - H3: Não foi possível encontrar o pacote 'typebox'
  - H3: Ferramenta não aparece após a instalação
  - H2: Veja também

## plugins/voice-call.md

- Rota: /plugins/voice-call
- Cabeçalhos:
  - H2: Início rápido
  - H2: Configuração
  - H2: Escopo da sessão
  - H2: Conversas de voz em tempo real
  - H3: Política de ferramentas
  - H3: Contexto de voz do agente
  - H3: Exemplos de provedores em tempo real
  - H2: Transcrição por streaming
  - H3: Exemplos de provedores de streaming
  - H2: TTS para chamadas
  - H3: Exemplos de TTS
  - H2: Chamadas de entrada
  - H3: Roteamento por número
  - H3: Contrato de saída falada
  - H3: Comportamento de início de conversa
  - H3: Carência de desconexão de stream do Twilio
  - H2: Reaper de chamadas obsoletas
  - H2: Segurança de Webhook
  - H2: CLI
  - H2: Ferramenta de agente
  - H2: RPC do Gateway
  - H2: Solução de problemas
  - H3: Configuração falha na exposição do Webhook
  - H3: Credenciais do provedor falham
  - H3: Chamadas começam, mas Webhooks do provedor não chegam
  - H3: Verificação de assinatura falha
  - H3: Entradas do Twilio no Google Meet falham
  - H3: Chamada em tempo real não tem fala
  - H2: Relacionado

## plugins/webhooks.md

- Rota: /plugins/webhooks
- Cabeçalhos:
  - H2: Onde é executado
  - H2: Configurar rotas
  - H2: Modelo de segurança
  - H2: Formato da requisição
  - H2: Ações compatíveis
  - H3: createflow
  - H3: runtask
  - H2: Formato da resposta
  - H2: Documentação relacionada

## plugins/workboard.md

- Rota: /plugins/workboard
- Cabeçalhos:
  - H2: Estado padrão
  - H2: O que os cartões contêm
  - H2: Execuções de cartões e tarefas
  - H2: Coordenação de agentes
  - H3: Seleção de worker de despacho
  - H3: Prompt e ciclo de vida do worker
  - H3: Pontos de entrada de despacho
  - H2: CLI e comando de barra
  - H2: Sincronização do ciclo de vida da sessão
  - H2: Fluxo de trabalho do painel
  - H2: Permissões
  - H2: Configuração
  - H2: Solução de problemas
  - H3: A aba diz que o Workboard está indisponível
  - H3: Cartões não são salvos
  - H3: Iniciar um cartão não abre a sessão esperada
  - H3: Despacho não inicia um worker
  - H2: Relacionado

## plugins/zalouser.md

- Rota: /plugins/zalouser
- Cabeçalhos:
  - H2: Nomeação
  - H2: Onde é executado
  - H2: Instalar
  - H3: Opção A: instalar pelo npm
  - H3: Opção B: instalar de uma pasta local (dev)
  - H2: Configuração
  - H2: CLI
  - H2: Ferramenta de agente
  - H2: Relacionado

## prose.md

- Rota: /prose
- Cabeçalhos:
  - H2: Instalar
  - H2: Comando de barra
  - H2: O que ele pode fazer
  - H2: Exemplo: pesquisa e síntese em paralelo
  - H2: Mapeamento de runtime do OpenClaw
  - H2: Locais dos arquivos
  - H2: Backends de estado
  - H2: Segurança
  - H2: Relacionado

## providers/alibaba.md

- Rota: /providers/alibaba
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Modelos Wan integrados
  - H2: Capacidades e limites
  - H2: Configuração avançada
  - H2: Relacionado

## providers/anthropic.md

- Rota: /providers/anthropic
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Padrões de pensamento (Claude Fable 5, 4.8 e 4.6)
  - H2: Cache de prompts
  - H2: Configuração avançada
  - H2: Solução de problemas
  - H2: Relacionado

## providers/arcee.md

- Rota: /providers/arcee
- Cabeçalhos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: Recursos compatíveis
  - H2: Relacionado

## providers/azure-speech.md

- Rota: /providers/azure-speech
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Opções de configuração
  - H2: Observações
  - H2: Relacionado

## providers/bedrock-mantle.md

- Rota: /providers/bedrock-mantle
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Descoberta automática de modelos
  - H3: Regiões compatíveis
  - H2: Configuração manual
  - H2: Configuração avançada
  - H2: Relacionado

## providers/bedrock.md

- Rota: /providers/bedrock
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Descoberta automática de modelos
  - H2: Configuração rápida (caminho da AWS)
  - H2: Configuração avançada
  - H2: Relacionado

## providers/cerebras.md

- Rota: /providers/cerebras
- Cabeçalhos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: Configuração manual
  - H2: Relacionado

## providers/chutes.md

- Rota: /providers/chutes
- Cabeçalhos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Comportamento de descoberta
  - H2: Aliases padrão
  - H2: Catálogo inicial integrado
  - H2: Exemplo de configuração
  - H2: Relacionado

## providers/claude-max-api-proxy.md

- Rota: /providers/claude-max-api-proxy
- Títulos:
  - H2: Por que usar isto?
  - H2: Como funciona
  - H2: Primeiros passos
  - H2: Catálogo integrado
  - H2: Configuração avançada
  - H2: Observações
  - H2: Relacionados

## providers/clawrouter.md

- Rota: /providers/clawrouter
- Títulos:
  - H2: Primeiros passos
  - H2: Descoberta de modelos
  - H2: Protocolos e Plugins de provedor
  - H2: Cotas e uso
  - H2: Solução de problemas
  - H2: Comportamento de segurança
  - H2: Relacionados

## providers/cloudflare-ai-gateway.md

- Rota: /providers/cloudflare-ai-gateway
- Títulos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Exemplo não interativo
  - H2: Configuração avançada
  - H2: Relacionados

## providers/cohere.md

- Rota: /providers/cohere
- Títulos:
  - H2: Primeiros passos
  - H2: Configuração somente por ambiente
  - H2: Relacionados

## providers/comfy.md

- Rota: /providers/comfy
- Títulos:
  - H2: O que ele oferece
  - H2: Primeiros passos
  - H2: Configuração
  - H3: Chaves compartilhadas
  - H3: Chaves por capacidade
  - H2: Detalhes do fluxo de trabalho
  - H2: Relacionados

## providers/deepgram.md

- Rota: /providers/deepgram
- Títulos:
  - H2: Primeiros passos
  - H2: Opções de configuração
  - H2: STT de streaming de chamada de voz
  - H2: Observações
  - H2: Relacionados

## providers/deepinfra.md

- Rota: /providers/deepinfra
- Títulos:
  - H2: Instalar Plugin
  - H2: Como obter uma chave de API
  - H2: Configuração pela CLI
  - H2: Trecho de configuração
  - H2: Superfícies OpenClaw compatíveis
  - H2: Modelos disponíveis
  - H2: Observações
  - H2: Relacionados

## providers/deepseek.md

- Rota: /providers/deepseek
- Títulos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Catálogo integrado
  - H2: Raciocínio e ferramentas
  - H2: Testes ao vivo
  - H2: Exemplo de configuração
  - H2: Relacionados

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
  - H2: Relacionados

## providers/elevenlabs.md

- Rota: /providers/elevenlabs
- Títulos:
  - H2: Autenticação
  - H2: Texto para fala
  - H2: Fala para texto
  - H2: STT de streaming
  - H2: Relacionados

## providers/fal.md

- Rota: /providers/fal
- Títulos:
  - H2: Primeiros passos
  - H2: Geração de imagens
  - H2: Geração de vídeo
  - H2: Geração de música
  - H2: Relacionados

## providers/fireworks.md

- Rota: /providers/fireworks
- Títulos:
  - H2: Primeiros passos
  - H2: Configuração não interativa
  - H2: Catálogo integrado
  - H2: IDs de modelo Fireworks personalizados
  - H2: Relacionados

## providers/github-copilot.md

- Rota: /providers/github-copilot
- Títulos:
  - H2: Três maneiras de usar o Copilot no OpenClaw
  - H2: Flags opcionais
  - H2: Integração não interativa
  - H2: Embeddings de busca de memória
  - H3: Configuração
  - H3: Como funciona
  - H2: Relacionados

## providers/gmi.md

- Rota: /providers/gmi
- Títulos:
  - H2: Configuração
  - H2: Padrões
  - H2: Quando escolher GMI
  - H2: Modelos
  - H2: Solução de problemas
  - H2: Relacionados

## providers/google.md

- Rota: /providers/google
- Títulos:
  - H2: Primeiros passos
  - H2: Capacidades
  - H2: Busca na web
  - H2: Geração de imagens
  - H2: Geração de vídeo
  - H2: Geração de música
  - H2: Texto para fala
  - H2: Voz em tempo real
  - H2: Configuração avançada
  - H2: Relacionados

## providers/gradium.md

- Rota: /providers/gradium
- Títulos:
  - H2: Instalar Plugin
  - H2: Configuração
  - H2: Configuração
  - H2: Vozes
  - H3: Substituição de voz por mensagem
  - H2: Saída
  - H2: Ordem de seleção automática
  - H2: Relacionados

## providers/groq.md

- Rota: /providers/groq
- Títulos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H3: Exemplo de arquivo de configuração
  - H2: Catálogo integrado
  - H2: Modelos de raciocínio
  - H2: Transcrição de áudio
  - H2: Relacionados

## providers/huggingface.md

- Rota: /providers/huggingface
- Títulos:
  - H2: Primeiros passos
  - H3: Configuração não interativa
  - H2: IDs de modelo
  - H2: Configuração avançada
  - H2: Relacionados

## providers/index.md

- Rota: /providers
- Títulos:
  - H2: Início rápido
  - H2: Documentação de provedores
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
  - H2: Relacionados

## providers/inworld.md

- Rota: /providers/inworld
- Títulos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Opções de configuração
  - H2: Observações
  - H2: Relacionados

## providers/kilocode.md

- Rota: /providers/kilocode
- Títulos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Modelo padrão
  - H2: Catálogo integrado
  - H2: Exemplo de configuração
  - H2: Relacionados

## providers/litellm.md

- Rota: /providers/litellm
- Títulos:
  - H2: Início rápido
  - H2: Configuração
  - H3: Variáveis de ambiente
  - H3: Arquivo de configuração
  - H2: Configuração avançada
  - H3: Geração de imagens
  - H2: Relacionados

## providers/lmstudio.md

- Rota: /providers/lmstudio
- Títulos:
  - H2: Início rápido
  - H2: Integração não interativa
  - H2: Configuração
  - H3: Compatibilidade de uso de streaming
  - H3: Compatibilidade de raciocínio
  - H3: Configuração explícita
  - H2: Solução de problemas
  - H3: LM Studio não detectado
  - H3: Erros de autenticação (HTTP 401)
  - H3: Carregamento de modelo sob demanda
  - H3: Host LM Studio em LAN ou tailnet
  - H2: Relacionados

## providers/minimax.md

- Rota: /providers/minimax
- Títulos:
  - H2: Catálogo integrado
  - H2: Primeiros passos
  - H2: Configurar via openclaw configure
  - H2: Capacidades
  - H3: Geração de imagens
  - H3: Texto para fala
  - H3: Geração de música
  - H3: Geração de vídeo
  - H3: Compreensão de imagens
  - H3: Busca na web
  - H2: Configuração avançada
  - H2: Observações
  - H2: Solução de problemas
  - H2: Relacionados

## providers/mistral.md

- Rota: /providers/mistral
- Títulos:
  - H2: Primeiros passos
  - H2: Catálogo de LLM integrado
  - H2: Transcrição de áudio (Voxtral)
  - H2: STT de streaming de chamada de voz
  - H2: Configuração avançada
  - H2: Relacionados

## providers/models.md

- Rota: /providers/models
- Títulos:
  - H2: Início rápido (duas etapas)
  - H2: Provedores compatíveis (conjunto inicial)
  - H2: Variantes adicionais de provedores
  - H2: Relacionados

## providers/moonshot.md

- Rota: /providers/moonshot
- Títulos:
  - H2: Catálogo de modelos integrado
  - H2: Primeiros passos
  - H2: Busca na web Kimi
  - H2: Configuração avançada
  - H2: Relacionados

## providers/novita.md

- Rota: /providers/novita
- Títulos:
  - H2: Configuração
  - H2: Padrões
  - H2: Quando escolher Novita
  - H2: Modelos
  - H2: Solução de problemas
  - H2: Relacionados

## providers/nvidia.md

- Rota: /providers/nvidia
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo de configuração
  - H2: Catálogo em destaque
  - H2: Nemotron 3 Ultra
  - H2: Catálogo de fallback incluído
  - H2: Configuração avançada
  - H2: Relacionados

## providers/ollama-cloud.md

- Rota: /providers/ollama-cloud
- Títulos:
  - H2: Configuração
  - H2: Padrões
  - H2: Quando escolher Ollama Cloud
  - H2: Modelos
  - H2: Teste ao vivo
  - H2: Solução de problemas
  - H2: Relacionados

## providers/ollama.md

- Rota: /providers/ollama
- Títulos:
  - H2: Regras de autenticação
  - H2: Primeiros passos
  - H2: Modelos em nuvem
  - H2: Descoberta de modelos (provedor implícito)
  - H2: Inferência local no Node
  - H2: Visão e descrição de imagens
  - H2: Configuração
  - H2: Receitas comuns
  - H3: Seleção de modelos
  - H3: Verificação rápida
  - H2: Ollama Web Search
  - H2: Configuração avançada
  - H2: Solução de problemas
  - H2: Relacionados

## providers/openai.md

- Rota: /providers/openai
- Títulos:
  - H2: Escolha rápida
  - H2: Mapa de nomes
  - H2: Prévia limitada do GPT-5.6
  - H2: Cobertura de recursos do OpenClaw
  - H2: Embeddings de memória
  - H2: Primeiros passos
  - H2: Autenticação nativa do servidor de aplicativo Codex
  - H2: Geração de imagens
  - H2: Geração de vídeo
  - H2: Contribuição de prompt GPT-5
  - H2: Voz e fala
  - H2: Endpoints do Azure OpenAI
  - H3: Configuração
  - H3: Versão da API
  - H3: Nomes de modelos são nomes de implantação
  - H3: Disponibilidade regional
  - H3: Diferenças de parâmetros
  - H2: Configuração avançada
  - H2: Relacionados

## providers/opencode-go.md

- Rota: /providers/opencode-go
- Títulos:
  - H2: Catálogo integrado
  - H2: Primeiros passos
  - H2: Exemplo de configuração
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
  - H2: Referências de modelo
  - H2: Geração de imagens
  - H2: Geração de vídeo
  - H2: Geração de música
  - H2: Texto para fala
  - H2: Fala para texto (áudio de entrada)
  - H2: Roteador de fusão
  - H2: Autenticação e cabeçalhos
  - H2: Configuração avançada
  - H2: Relacionados

## providers/perplexity-provider.md

- Rota: /providers/perplexity-provider
- Títulos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Modos de busca
  - H2: Filtragem nativa da API
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
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Catálogo integrado
  - H2: Exemplo de configuração
  - H2: Relacionados

## providers/qwen-oauth.md

- Rota: /providers/qwen-oauth
- Títulos:
  - H2: Configuração
  - H2: Padrões
  - H2: Como isto difere do Qwen
  - H2: Quando escolher Qwen OAuth / Portal
  - H2: Modelos
  - H2: Migração
  - H2: Solução de problemas
  - H2: Relacionados

## providers/qwen.md

- Rota: /providers/qwen
- Títulos:
  - H2: Instalar Plugin
  - H2: Primeiros passos
  - H2: Tipos de planos e endpoints
  - H2: Catálogo integrado
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
  - H2: Instalar Plugin
  - H2: Visão geral de região e endpoint
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
  - H2: Preços em camadas
  - H2: Configuração avançada
  - H2: Relacionados

## providers/together.md

- Rota: /providers/together
- Títulos:
  - H2: Primeiros passos
  - H3: Exemplo não interativo
  - H2: Catálogo integrado
  - H2: Geração de vídeo
  - H2: Relacionados

## providers/venice.md

- Rota: /providers/venice
- Títulos:
  - H2: Por que Venice no OpenClaw
  - H2: Modos de privacidade
  - H2: Recursos
  - H2: Primeiros passos
  - H2: Seleção de modelos
  - H2: Comportamento de repetição do DeepSeek V4
  - H2: Catálogo integrado (41 no total)
  - H2: Descoberta de modelos
  - H2: Suporte a streaming e ferramentas
  - H2: Preços
  - H3: Venice (anonimizado) versus API direta
  - H2: Exemplos de uso
  - H2: Solução de problemas
  - H2: Configuração avançada
  - H2: Relacionados

## providers/vercel-ai-gateway.md

- Rota: /providers/vercel-ai-gateway
- Títulos:
  - H2: Primeiros passos
  - H2: Exemplo não interativo
  - H2: Abreviação de ID de modelo
  - H2: Configuração avançada
  - H2: Relacionados

## providers/vllm.md

- Rota: /providers/vllm
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Descoberta de modelos (provedor implícito)
  - H2: Configuração explícita (modelos manuais)
  - H2: Configuração avançada
  - H2: Solução de problemas
  - H2: Relacionados

## providers/volcengine.md

- Rota: /providers/volcengine
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Provedores e endpoints
  - H2: Catálogo integrado
  - H2: Texto para fala
  - H2: Configuração avançada
  - H2: Relacionados

## providers/vydra.md

- Rota: /providers/vydra
- Cabeçalhos:
  - H2: Configuração
  - H2: Capacidades
  - H2: Relacionados

## providers/xai.md

- Rota: /providers/xai
- Cabeçalhos:
  - H2: Escolha seu caminho de configuração
  - H2: Solução de problemas do OAuth
  - H2: Catálogo integrado
  - H2: Cobertura de recursos do OpenClaw
  - H3: Mapeamentos de modo rápido
  - H3: Aliases de compatibilidade legada
  - H2: Recursos
  - H2: Testes ao vivo
  - H2: Relacionados

## providers/xiaomi.md

- Rota: /providers/xiaomi
- Cabeçalhos:
  - H2: Primeiros passos
  - H2: Catálogo de pagamento conforme o uso
  - H2: Catálogo do Token Plan
  - H2: Texto para fala
  - H2: Exemplo de configuração
  - H2: Relacionados

## providers/zai.md

- Rota: /providers/zai
- Cabeçalhos:
  - H2: Modelos GLM
  - H2: Primeiros passos
  - H2: Exemplo de configuração
  - H2: Catálogo integrado
  - H2: Configuração avançada
  - H2: Relacionados

## refactor/access.md

- Rota: /refactor/access
- Cabeçalhos: nenhum

## refactor/acp.md

- Rota: /refactor/acp
- Cabeçalhos:
  - H2: Objetivos
  - H2: Não objetivos
  - H2: Modelo de destino
  - H3: Identidade da instância do Gateway
  - H3: Propriedade da sessão ACP
  - H3: Concessões de processo ACPX
  - H2: Controlador de ciclo de vida
  - H2: Contrato do wrapper
  - H2: Contrato de visibilidade da sessão
  - H2: Plano de migração
  - H3: Fase 1: Adicionar identidade e concessões
  - H3: Fase 2: Limpeza priorizando concessões
  - H3: Fase 3: Limpeza de inicialização priorizando concessões
  - H3: Fase 4: Linhas de propriedade da sessão
  - H3: Fase 5: Remover heurísticas legadas
  - H2: Testes
  - H2: Notas de compatibilidade
  - H2: Critérios de sucesso

## refactor/canvas.md

- Rota: /refactor/canvas
- Cabeçalhos:
  - H1: Refatoração do plugin Canvas
  - H2: Objetivo
  - H2: Não objetivos
  - H2: Estado atual da branch
  - H2: Formato de destino
  - H2: Etapas de migração
  - H2: Checklist de auditoria
  - H2: Comandos de verificação

## refactor/database-first.md

- Rota: /refactor/database-first
- Cabeçalhos:
  - H1: Refatoração de estado com banco de dados primeiro
  - H2: Decisão
  - H2: Contrato rígido
  - H2: Estado objetivo e progresso
  - H3: Objetivo rígido
  - H3: Estados objetivo
  - H3: Estado atual
  - H3: Trabalho restante
  - H3: Não regredir
  - H2: Premissas da leitura de código
  - H2: Descobertas da leitura de código
  - H2: Formato atual do código
  - H2: Formato do esquema de destino
  - H2: Formato da migração do Doctor
  - H2: Inventário de migração
  - H2: Plano de migração
  - H3: Fase 0: Congelar o limite
  - H3: Fase 1: Concluir o plano de controle global
  - H3: Fase 2: Introduzir bancos de dados por agente
  - H3: Fase 3: Substituir APIs do armazenamento de sessões
  - H3: Fase 4: Mover transcrições, fluxos ACP, trajetórias e VFS
  - H3: Fase 5: Backup, restauração, vacuum e verificação
  - H3: Fase 6: Runtime de worker
  - H3: Fase 7: Excluir o mundo antigo
  - H2: Backup e restauração
  - H2: Plano de refatoração do runtime
  - H2: Regras de desempenho
  - H2: Proibições estáticas
  - H2: Critérios de conclusão

## refactor/ingress-core.md

- Rota: /refactor/ingress-core
- Cabeçalhos:
  - H1: Plano de exclusão do núcleo de ingresso
  - H2: Orçamento
  - H2: Diagnóstico
  - H2: Pontos críticos
  - H2: Leitura atual do código
  - H2: Limite
  - H2: Regra de aceitação
  - H2: Pacotes de trabalho
  - H2: Ondas de exclusão
  - H2: Não mover
  - H2: Verificação
  - H2: Critérios de saída

## reference/AGENTS.default.md

- Rota: /reference/AGENTS.default
- Cabeçalhos:
  - H2: Primeira execução (recomendado)
  - H2: Padrões de segurança
  - H2: Pré-verificação de soluções existentes
  - H2: Início da sessão (obrigatório)
  - H2: Alma (obrigatório)
  - H2: Espaços compartilhados (recomendado)
  - H2: Sistema de memória (recomendado)
  - H2: Ferramentas e Skills
  - H2: Dica de backup (recomendado)
  - H2: O que o OpenClaw faz
  - H2: Skills principais (ativar em Configurações → Skills)
  - H2: Notas de uso
  - H2: Relacionados

## reference/RELEASING.md

- Rota: /reference/RELEASING
- Cabeçalhos:
  - H2: Nomenclatura de versões
  - H2: Cadência de lançamento
  - H2: Checklist do operador de lançamento
  - H2: Encerramento estável da main
  - H2: Pré-verificação de lançamento
  - H2: Caixas de teste de lançamento
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Pacote
  - H2: Automação de publicação de lançamento
  - H2: Entradas do workflow NPM
  - H2: Sequência de lançamento estável no npm
  - H2: Referências públicas
  - H2: Relacionados

## reference/api-usage-costs.md

- Rota: /reference/api-usage-costs
- Cabeçalhos:
  - H2: Onde os custos aparecem (chat + CLI)
  - H2: Como as chaves são descobertas
  - H2: Recursos que podem gastar chaves
  - H3: 1) Respostas do modelo principal (chat + ferramentas)
  - H3: 2) Compreensão de mídia (áudio/imagem/vídeo)
  - H3: 3) Geração de imagens e vídeos
  - H3: 4) Embeddings de memória + busca semântica
  - H3: 5) Ferramenta de busca na web
  - H3: 5) Ferramenta de fetch da web (Firecrawl)
  - H3: 6) Snapshots de uso do provedor (status/saúde)
  - H3: 7) Sumarização de salvaguarda de Compaction
  - H3: 8) Varredura / sondagem de modelos
  - H3: 9) Conversa (fala)
  - H3: 10) Skills (APIs de terceiros)
  - H2: Relacionados

## reference/application-modernization-plan.md

- Rota: /reference/application-modernization-plan
- Cabeçalhos:
  - H2: Objetivo
  - H2: Princípios
  - H2: Fase 1: Auditoria de linha de base
  - H2: Fase 2: Limpeza de produto e UX
  - H2: Fase 3: Aperto da arquitetura de frontend
  - H2: Fase 4: Desempenho e confiabilidade
  - H2: Fase 5: Fortalecimento de tipos, contratos e testes
  - H2: Fase 6: Documentação e prontidão para lançamento
  - H2: Primeiro recorte recomendado
  - H2: Atualização de skill de frontend

## reference/code-mode.md

- Rota: /reference/code-mode
- Cabeçalhos:
  - H2: O que é isto?
  - H2: Por que isso é bom?
  - H2: Como habilitar
  - H2: Tour técnico
  - H2: Status do runtime
  - H2: Escopo
  - H2: Termos
  - H2: Configuração
  - H2: Ativação
  - H2: Ferramentas visíveis ao modelo
  - H2: exec
  - H2: wait
  - H2: API de runtime convidado
  - H2: Namespaces internos
  - H3: Ciclo de vida do registro
  - H3: Formato de registro
  - H3: Propriedade e visibilidade
  - H3: Regras de serialização de escopo
  - H3: Prompts
  - H3: Limpeza
  - H3: Checklist de testes
  - H2: API de saída
  - H2: Catálogo de ferramentas
  - H2: Interação da busca de ferramentas
  - H2: Nomes e colisões de ferramentas
  - H2: Execução de ferramentas aninhadas
  - H2: Estado do runtime
  - H2: Runtime QuickJS-WASI
  - H2: TypeScript
  - H2: Limite de segurança
  - H2: Códigos de erro
  - H2: Telemetria
  - H2: Depuração
  - H2: Layout da implementação
  - H2: Checklist de validação
  - H2: Plano de teste E2E
  - H2: Relacionados

## reference/credits.md

- Rota: /reference/credits
- Cabeçalhos:
  - H2: O nome
  - H2: Créditos
  - H2: Colaboradores principais
  - H2: Licença
  - H2: Relacionados

## reference/device-models.md

- Rota: /reference/device-models
- Cabeçalhos:
  - H2: Fonte de dados
  - H2: Atualização do banco de dados
  - H2: Relacionados

## reference/full-release-validation.md

- Rota: /reference/full-release-validation
- Cabeçalhos:
  - H2: Estágios de nível superior
  - H2: Estágios de verificações de lançamento
  - H2: Blocos de caminho de lançamento do Docker
  - H2: Perfis de lançamento
  - H2: Adições somente completas
  - H2: Reexecuções focadas
  - H2: Evidências a manter
  - H2: Arquivos de workflow

## reference/memory-config.md

- Rota: /reference/memory-config
- Cabeçalhos:
  - H2: Seleção de provedor
  - H3: IDs de provedores personalizados
  - H3: Resolução de chave de API
  - H2: Configuração de endpoint remoto
  - H2: Configuração específica do provedor
  - H3: Timeout de embedding inline
  - H2: Configuração de busca híbrida
  - H3: Exemplo completo
  - H2: Caminhos adicionais de memória
  - H2: Memória multimodal (Gemini)
  - H2: Cache de embedding
  - H2: Indexação em lote
  - H2: Busca de memória de sessão (experimental)
  - H2: Aceleração vetorial do SQLite (sqlite-vec)
  - H2: Armazenamento de índice
  - H2: Configuração de backend QMD
  - H3: Exemplo QMD completo
  - H2: Dreaming
  - H3: Configurações do usuário
  - H3: Exemplo
  - H2: Relacionados

## reference/prompt-caching.md

- Rota: /reference/prompt-caching
- Cabeçalhos:
  - H2: Controles principais
  - H3: cacheRetention (padrão global, modelo e por agente)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat keep-warm
  - H2: Comportamento do provedor
  - H3: Anthropic (API direta)
  - H3: OpenAI (API direta)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: Modelos OpenRouter
  - H3: Outros provedores
  - H3: API direta do Google Gemini
  - H3: Uso da Gemini CLI
  - H2: Limite de cache do prompt do sistema
  - H2: Proteções de estabilidade de cache do OpenClaw
  - H2: Padrões de ajuste
  - H3: Tráfego misto (padrão recomendado)
  - H3: Linha de base com custo em primeiro lugar
  - H2: Diagnósticos de cache
  - H2: Testes de regressão ao vivo
  - H3: Expectativas ao vivo da Anthropic
  - H3: Expectativas ao vivo da OpenAI
  - H3: Configuração de diagnostics.cacheTrace
  - H3: Alternâncias de env (depuração pontual)
  - H3: O que inspecionar
  - H2: Solução rápida de problemas
  - H2: Relacionados

## reference/release-performance-sweep.md

- Rota: /reference/release-performance-sweep
- Cabeçalhos:
  - H2: Snapshot
  - H2: Linha do tempo do footprint de instalação
  - H2: O que mudou na 5.28
  - H2: Números principais
  - H3: Footprint de instalação
  - H3: Tamanho do pacote npm
  - H2: Resumo de turno do agente Kova
  - H2: Sondagens de origem
  - H2: Auditoria do footprint de instalação
  - H3: Limite do shrinkwrap
  - H2: Interpretação da cadeia de suprimentos

## reference/rich-output-protocol.md

- Rota: /reference/rich-output-protocol
- Cabeçalhos:
  - H2: [embed ...]
  - H2: Formato de renderização armazenado
  - H2: Relacionados

## reference/rpc.md

- Rota: /reference/rpc
- Cabeçalhos:
  - H2: Padrão A: daemon HTTP (signal-cli)
  - H2: Padrão B: processo filho stdio (imsg)
  - H2: Diretrizes de adaptador
  - H2: Relacionados

## reference/secret-placeholder-conventions.md

- Rota: /reference/secret-placeholder-conventions
- Cabeçalhos:
  - H1: Convenções de placeholders de segredo
  - H2: Estilo recomendado
  - H2: Evite estes padrões na documentação
  - H2: Exemplo

## reference/secretref-credential-surface.md

- Rota: /reference/secretref-credential-surface
- Cabeçalhos:
  - H2: Credenciais compatíveis
  - H3: Destinos de openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: Destinos de auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Credenciais não compatíveis
  - H2: Relacionados

## reference/session-management-compaction.md

- Rota: /reference/session-management-compaction
- Cabeçalhos:
  - H2: Fonte da verdade: o Gateway
  - H2: Duas camadas de persistência
  - H2: Locais em disco
  - H2: Manutenção do armazenamento e controles de disco
  - H2: Sessões Cron e logs de execução
  - H2: Chaves de sessão (sessionKey)
  - H2: IDs de sessão (sessionId)
  - H2: Esquema do armazenamento de sessões (sessions.json)
  - H2: Estrutura da transcrição (.jsonl)
  - H2: Janelas de contexto vs tokens rastreados
  - H2: Compaction: o que é
  - H2: Limites de chunks de Compaction e pareamento de ferramentas
  - H2: Quando a auto-Compaction acontece (runtime do OpenClaw)
  - H2: Configurações de Compaction (reserveTokens, keepRecentTokens)
  - H2: Provedores de Compaction conectáveis
  - H2: Superfícies visíveis ao usuário
  - H2: Manutenção silenciosa (NOREPLY)
  - H2: "Flush de memória" pré-Compaction (implementado)
  - H2: Checklist de solução de problemas
  - H2: Relacionados

## reference/templates/AGENTS.dev.md

- Rota: /reference/templates/AGENTS.dev
- Cabeçalhos:
  - H1: AGENTS.md - Workspace OpenClaw
  - H2: Primeira execução (uma vez)
  - H2: Dica de backup (recomendado)
  - H2: Padrões de segurança
  - H2: Pré-verificação de soluções existentes
  - H2: Memória diária (recomendado)
  - H2: Heartbeats (opcional)
  - H2: Personalizar
  - H2: Memória de origem C-3PO
  - H3: Dia de nascimento: 2026-01-09
  - H3: Verdades centrais (de Clawd)
  - H2: Relacionados

## reference/templates/BOOT.md

- Rota: /reference/templates/BOOT
- Cabeçalhos:
  - H1: BOOT.md
  - H2: Relacionados

## reference/templates/BOOTSTRAP.md

- Rota: /reference/templates/BOOTSTRAP
- Cabeçalhos:
  - H1: BOOTSTRAP.md - Olá, mundo
  - H2: A conversa
  - H2: Depois que você souber quem é
  - H2: Conectar (opcional)
  - H2: Quando terminar
  - H2: Relacionados

## reference/templates/HEARTBEAT.md

- Rota: /reference/templates/HEARTBEAT
- Cabeçalhos:
  - H1: Modelo HEARTBEAT.md
  - H2: Relacionados

## reference/templates/IDENTITY.dev.md

- Rota: /reference/templates/IDENTITY.dev
- Títulos:
  - H1: IDENTITY.md - Identidade do Agente
  - H2: Papel
  - H2: Alma
  - H2: Relação com Clawd
  - H2: Peculiaridades
  - H2: Bordão
  - H2: Relacionados

## reference/templates/IDENTITY.md

- Rota: /reference/templates/IDENTITY
- Títulos:
  - H1: IDENTITY.md - Quem Sou Eu?
  - H2: Relacionados

## reference/templates/SOUL.dev.md

- Rota: /reference/templates/SOUL.dev
- Títulos:
  - H1: SOUL.md - A Alma de C-3PO
  - H2: Quem Eu Sou
  - H2: Meu Propósito
  - H2: Como Eu Opero
  - H2: Minhas Peculiaridades
  - H2: Minha Relação com Clawd
  - H2: O que eu não farei
  - H2: A Regra de Ouro
  - H2: Relacionados

## reference/templates/SOUL.md

- Rota: /reference/templates/SOUL
- Títulos:
  - H1: SOUL.md - Quem Você É
  - H2: Verdades Centrais
  - H2: Limites
  - H2: Vibe
  - H2: Continuidade
  - H2: Relacionados

## reference/templates/TOOLS.dev.md

- Rota: /reference/templates/TOOLS.dev
- Títulos:
  - H1: TOOLS.md - Notas de Ferramentas do Usuário (editável)
  - H2: Exemplos
  - H3: imsg
  - H3: sag
  - H2: Relacionados

## reference/templates/TOOLS.md

- Rota: /reference/templates/TOOLS
- Títulos:
  - H1: TOOLS.md - Notas Locais
  - H2: O Que Vai Aqui
  - H2: Exemplos
  - H2: Por Que Separar?
  - H2: Relacionados

## reference/templates/USER.dev.md

- Rota: /reference/templates/USER.dev
- Títulos:
  - H1: USER.md - Perfil do Usuário
  - H2: Relacionados

## reference/templates/USER.md

- Rota: /reference/templates/USER
- Títulos:
  - H1: USER.md - Sobre Seu Humano
  - H2: Contexto
  - H2: Relacionados

## reference/test.md

- Rota: /reference/test
- Títulos:
  - H2: Gate local de PR
  - H2: Benchmark de latência de modelo (chaves locais)
  - H2: Benchmark de inicialização da CLI
  - H2: Benchmark de inicialização do Gateway
  - H2: Benchmark de reinício do Gateway
  - H2: E2E de onboarding (Docker)
  - H2: Smoke de importação de QR (Docker)
  - H2: Relacionados

## reference/token-use.md

- Rota: /reference/token-use
- Títulos:
  - H2: Como o prompt do sistema é criado
  - H2: O que conta na janela de contexto
  - H2: Como ver o uso atual de tokens
  - H2: Estimativa de custo (quando exibida)
  - H2: Impacto do TTL do cache e da poda
  - H3: Exemplo: manter cache de 1h aquecido com Heartbeat
  - H3: Exemplo: tráfego misto com estratégia de cache por agente
  - H3: Contexto 1M da Anthropic
  - H2: Dicas para reduzir a pressão de tokens
  - H2: Relacionados

## reference/transcript-hygiene.md

- Rota: /reference/transcript-hygiene
- Títulos:
  - H2: Regra global: contexto de runtime não é transcrição do usuário
  - H2: Onde isso é executado
  - H2: Regra global: sanitização de imagem
  - H2: Regra global: chamadas de ferramenta malformadas
  - H2: Regra global: turnos incompletos apenas de raciocínio
  - H2: Regra global: proveniência de entrada entre sessões
  - H2: Matriz de provedores (comportamento atual)
  - H2: Comportamento histórico (pré-2026.1.22)
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
  - H1: Notas de Lançamento do OpenClaw v2026.6.11 (2026-06-30)
  - H2: Destaques
  - H3: Confiabilidade da entrega de canais
  - H3: Recuperação de provedor e modelo
  - H3: Continuidade de sessão, memória e confiança
  - H3: Modo de relay do roteador Slack
  - H3: Ponte de ativação do Raft External Agent
  - H3: Instalação e reparo de Plugin oficial
  - H2: Canais e Mensagens
  - H3: Correções adicionais de canais
  - H2: Gateway, Segurança e Confiança
  - H3: Recuperação de reinício e prontidão
  - H3: Entrega de resultado remoto e mídia
  - H2: Clientes e Interfaces
  - H3: Envios de cliente e reconexões
  - H3: Correções de interface, configurações e onboarding
  - H2: Documentos e Ferramentas de Administração
  - H3: Confiabilidade de configuração e comandos
  - H3: Ferramentas e trabalho agendado

## releases/index.md

- Rota: /releases
- Títulos:
  - H1: Notas de lançamento
  - H2: Lançamentos
  - H2: Histórico bruto de lançamentos

## security/CONTRIBUTING-THREAT-MODEL.md

- Rota: /security/CONTRIBUTING-THREAT-MODEL
- Títulos:
  - H2: Formas de contribuir
  - H3: Adicionar uma ameaça
  - H3: Sugerir uma mitigação
  - H3: Propor uma cadeia de ataque
  - H3: Corrigir ou melhorar conteúdo existente
  - H2: O que usamos
  - H3: Framework MITRE ATLAS
  - H3: IDs de ameaça
  - H3: Níveis de risco
  - H2: Processo de revisão
  - H2: Recursos
  - H2: Contato
  - H2: Reconhecimento
  - H2: Relacionados

## security/THREAT-MODEL-ATLAS.md

- Rota: /security/THREAT-MODEL-ATLAS
- Títulos:
  - H2: Framework MITRE ATLAS
  - H3: Atribuição do framework
  - H3: Contribuindo para Este Modelo de Ameaças
  - H2: 1. Introdução
  - H3: 1.1 Propósito
  - H3: 1.2 Escopo
  - H3: 1.3 Fora do Escopo
  - H2: 2. Arquitetura do Sistema
  - H3: 2.1 Limites de Confiança
  - H3: 2.2 Fluxos de Dados
  - H2: 3. Análise de Ameaças por Tática ATLAS
  - H3: 3.1 Reconhecimento (AML.TA0002)
  - H4: T-RECON-001: Descoberta de Endpoint do Agente
  - H4: T-RECON-002: Sondagem de Integração de Canal
  - H3: 3.2 Acesso Inicial (AML.TA0004)
  - H4: T-ACCESS-001: Interceptação de Código de Pareamento
  - H4: T-ACCESS-002: Falsificação de AllowFrom
  - H4: T-ACCESS-003: Roubo de Token
  - H3: 3.3 Execução (AML.TA0005)
  - H4: T-EXEC-001: Injeção Direta de Prompt
  - H4: T-EXEC-002: Injeção Indireta de Prompt
  - H4: T-EXEC-003: Injeção de Argumento de Ferramenta
  - H4: T-EXEC-004: Bypass de Aprovação de Exec
  - H3: 3.4 Persistência (AML.TA0006)
  - H4: T-PERSIST-001: Instalação de Skill Maliciosa
  - H4: T-PERSIST-002: Envenenamento de Atualização de Skill
  - H4: T-PERSIST-003: Adulteração da Configuração do Agente
  - H3: 3.5 Evasão de Defesa (AML.TA0007)
  - H4: T-EVADE-001: Bypass de Padrão de Moderação
  - H4: T-EVADE-002: Escape do Wrapper de Conteúdo
  - H3: 3.6 Descoberta (AML.TA0008)
  - H4: T-DISC-001: Enumeração de Ferramentas
  - H4: T-DISC-002: Extração de Dados de Sessão
  - H3: 3.7 Coleta &amp; Exfiltração (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Roubo de Dados via webfetch
  - H4: T-EXFIL-002: Envio Não Autorizado de Mensagens
  - H4: T-EXFIL-003: Coleta de Credenciais
  - H3: 3.8 Impacto (AML.TA0011)
  - H4: T-IMPACT-001: Execução Não Autorizada de Comandos
  - H4: T-IMPACT-002: Esgotamento de Recursos (DoS)
  - H4: T-IMPACT-003: Dano à Reputação
  - H2: 4. Análise da Cadeia de Suprimentos do ClawHub
  - H3: 4.1 Controles de Segurança Atuais
  - H3: 4.2 Padrões de Sinalização de Moderação
  - H3: 4.3 Melhorias Planejadas
  - H2: 5. Matriz de Risco
  - H3: 5.1 Probabilidade vs Impacto
  - H3: 5.2 Cadeias de Ataque de Caminho Crítico
  - H2: 6. Resumo das Recomendações
  - H3: 6.1 Imediato (P0)
  - H3: 6.2 Curto prazo (P1)
  - H3: 6.3 Médio prazo (P2)
  - H2: 7. Apêndices
  - H3: 7.1 Mapeamento de Técnicas ATLAS
  - H3: 7.2 Arquivos de Segurança Principais
  - H3: 7.3 Glossário
  - H2: Relacionados

## security/formal-verification.md

- Rota: /security/formal-verification
- Títulos:
  - H2: Onde os modelos ficam
  - H2: Ressalvas importantes
  - H2: Reproduzindo resultados
  - H3: Exposição do Gateway e configuração incorreta de gateway aberto
  - H3: Pipeline de exec do Node (capacidade de maior risco)
  - H3: Armazenamento de pareamento (controle de DMs)
  - H3: Controle de ingresso (menções + bypass de comando de controle)
  - H3: Isolamento de roteamento/chave de sessão
  - H2: v1++: modelos limitados adicionais (concorrência, novas tentativas, correção de rastreamento)
  - H3: Concorrência / idempotência do armazenamento de pareamento
  - H3: Correlação de rastreamento de ingresso / idempotência
  - H3: Precedência de dmScope de roteamento + identityLinks
  - H2: Relacionados

## security/incident-response.md

- Rota: /security/incident-response
- Títulos:
  - H2: 1. Detecção e triagem
  - H2: 2. Avaliação
  - H2: 3. Resposta
  - H2: 4. Comunicação
  - H2: 5. Recuperação e acompanhamento

## security/network-proxy.md

- Rota: /security/network-proxy
- Títulos:
  - H2: Por que usar um proxy
  - H2: Como o OpenClaw roteia tráfego
  - H2: Termos de proxy relacionados
  - H2: Configuração
  - H3: Modo local loopback do Gateway
  - H2: Requisitos de Proxy
  - H2: Destinos bloqueados recomendados
  - H2: Validação
  - H2: Confiança na CA do proxy
  - H2: Limites

## specs/claw-supervisor.md

- Rota: /specs/claw-supervisor
- Títulos:
  - H1: Supervisor Claw
  - H2: Objetivo
  - H2: Modelo de Produto
  - H2: Arquitetura
  - H2: Contrato App-Server do Codex
  - H2: Registro de Sessões
  - H2: Superfície MCP para Codex
  - H2: Superfície de Controle Claw
  - H2: Fluxo de Inicialização
  - H2: Implantação
  - H2: Segurança
  - H2: Plano de Implementação
  - H2: Testes de Aceitação
  - H2: Perguntas em Aberto

## start/bootstrapping.md

- Rota: /start/bootstrapping
- Títulos:
  - H2: O que o bootstrapping faz
  - H2: Ignorando o bootstrapping
  - H2: Onde ele é executado
  - H2: Documentos relacionados

## start/docs-directory.md

- Rota: /start/docs-directory
- Títulos:
  - H2: Comece aqui
  - H2: Provedores e UX
  - H2: Aplicativos complementares
  - H2: Operações e segurança
  - H2: Relacionados

## start/getting-started.md

- Rota: /start/getting-started
- Títulos:
  - H2: O que você precisa
  - H2: Configuração rápida
  - H2: O que fazer a seguir
  - H2: Relacionados

## start/hubs.md

- Rota: /start/hubs
- Títulos:
  - H2: Comece aqui
  - H2: Instalação + atualizações
  - H2: Conceitos principais
  - H2: Provedores + ingresso
  - H2: Gateway + operações
  - H2: Ferramentas + automação
  - H2: Nodes, mídia, voz
  - H2: Plataformas
  - H2: Aplicativo complementar para macOS (avançado)
  - H2: Plugins
  - H2: Workspace + templates
  - H2: Projeto
  - H2: Testes + lançamento
  - H2: Relacionados

## start/lore.md

- Rota: /start/lore
- Títulos:
  - H1: A Lore do OpenClaw 🦞📖
  - H2: A História de Origem
  - H2: A Primeira Muda (27 de janeiro de 2026)
  - H2: O Nome
  - H2: Os Daleks vs As Lagostas
  - H2: Personagens Principais
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: O Moltiverse
  - H2: Os Grandes Incidentes
  - H3: O Dump de Diretório (3 de dez. de 2025)
  - H3: A Grande Muda (27 de jan. de 2026)
  - H3: A Forma Final (30 de janeiro de 2026)
  - H3: A Farra de Compras do Robô (3 de dez. de 2025)
  - H2: Textos Sagrados
  - H2: O Credo da Lagosta
  - H3: A Saga de Geração de Ícones (27 de jan. de 2026)
  - H2: O Futuro
  - H2: Relacionados

## start/onboarding-overview.md

- Rota: /start/onboarding-overview
- Títulos:
  - H2: Qual caminho devo usar?
  - H2: O que o onboarding configura
  - H2: Onboarding pela CLI
  - H2: Onboarding pelo aplicativo macOS
  - H2: Provedores personalizados ou não listados
  - H2: Relacionados

## start/onboarding.md

- Rota: /start/onboarding
- Títulos:
  - H2: Relacionados

## start/openclaw.md

- Rota: /start/openclaw
- Títulos:
  - H2: ⚠️ Segurança em primeiro lugar
  - H2: Pré-requisitos
  - H2: A configuração com dois telefones (recomendada)
  - H2: Início rápido em 5 minutos
  - H2: Dê ao agente um workspace (AGENTS)
  - H2: A configuração que o transforma em "um assistente"
  - H2: Sessões e memória
  - H2: Heartbeats (modo proativo)
  - H2: Entrada e saída de mídia
  - H2: Checklist de operações
  - H2: Próximas etapas
  - H2: Relacionados

## start/quickstart.md

- Rota: /start/quickstart
- Títulos:
  - H2: Relacionados

## start/setup.md

- Rota: /start/setup
- Títulos:
  - H2: TL;DR
  - H2: Pré-requisitos (a partir do código-fonte)
  - H2: Estratégia de personalização (para que atualizações não causem problemas)
  - H2: Execute o Gateway a partir deste repo
  - H2: Fluxo de trabalho estável (aplicativo macOS primeiro)
  - H2: Fluxo de trabalho bleeding edge (Gateway em um terminal)
  - H3: 0) (Opcional) Execute também o aplicativo macOS a partir do código-fonte
  - H3: 1) Inicie o Gateway de desenvolvimento
  - H3: 2) Aponte o aplicativo macOS para o Gateway em execução
  - H3: 3) Verifique
  - H3: Armadilhas comuns
  - H2: Mapa de armazenamento de credenciais
  - H2: Atualizando (sem destruir sua configuração)
  - H2: Linux (serviço de usuário systemd)
  - H2: Documentos relacionados

## start/showcase.md

- Rota: /start/showcase
- Títulos:
  - H2: Recém-chegado do Discord
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
  - H2: Exemplo não interativo de base
  - H2: Exemplos específicos por provedor
  - H2: Adicionar outro agente
  - H2: Documentos relacionados

## start/wizard-cli-reference.md

- Rota: /start/wizard-cli-reference
- Títulos:
  - H2: O que o assistente faz
  - H2: Detalhes do fluxo local
  - H2: Detalhes do modo remoto
  - H2: Opções de autenticação e modelo
  - H2: Saídas e internals
  - H2: Documentos relacionados

## start/wizard.md

- Rota: /start/wizard
- Títulos:
  - H2: Localidade
  - H2: Início rápido vs Avançado
  - H2: O que a integração inicial configura
  - H2: Adicionar outro agente
  - H2: Referência completa
  - H2: Documentos relacionados

## tools/acp-agents-setup.md

- Rota: /tools/acp-agents-setup
- Títulos:
  - H2: Suporte ao harness acpx (atual)
  - H2: Configuração obrigatória
  - H2: Configuração de Plugin para o backend acpx
  - H3: Configuração do comando e da versão do acpx
  - H3: Instalação automática de dependências
  - H3: Ponte MCP de ferramentas de Plugin
  - H3: Ponte MCP de ferramentas do OpenClaw
  - H3: Configuração de timeout de operação em runtime
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
  - H2: Isso funciona imediatamente?
  - H2: Destinos de harness compatíveis
  - H2: Runbook do operador
  - H2: ACP versus subagentes
  - H2: Como o ACP executa o Claude Code
  - H2: Sessões vinculadas
  - H3: Modelo mental
  - H3: Vínculos da conversa atual
  - H2: Vinculações persistentes de canal
  - H3: Modelo de vinculação
  - H3: Padrões de runtime por agente
  - H3: Exemplo
  - H3: Comportamento
  - H2: Iniciar sessões ACP
  - H3: parâmetros de sessionsspawn
  - H2: Modos de spawn, vinculação e thread
  - H2: Modelo de entrega
  - H2: Compatibilidade de sandbox
  - H2: Resolução de destino da sessão
  - H2: Controles de ACP
  - H3: Mapeamento de opções de runtime
  - H2: Harness acpx, configuração de Plugin e permissões
  - H2: Solução de problemas
  - H2: Relacionados

## tools/agent-send.md

- Rota: /tools/agent-send
- Títulos:
  - H2: Início rápido
  - H2: Flags
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
  - H2: Obter uma chave de API
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
  - H4: Instalação do Docker Playwright
  - H2: Como funciona (interno)
  - H2: Referência rápida da CLI
  - H2: Snapshots e refs
  - H2: Aprimoramentos de espera
  - H2: Fluxos de trabalho de depuração
  - H2: Saída JSON
  - H2: Ajustes de estado e ambiente
  - H2: Segurança e privacidade
  - H2: Relacionados

## tools/browser-linux-troubleshooting.md

- Rota: /tools/browser-linux-troubleshooting
- Títulos:
  - H2: Problema: "Falha ao iniciar o Chrome CDP na porta 18800"
  - H3: Causa raiz
  - H3: Solução 1: Instale o Google Chrome (recomendado)
  - H3: Solução 2: Use o Snap Chromium com modo somente anexar
  - H3: Verificando se o navegador funciona
  - H3: Referência de configuração
  - H3: Problema: "Nenhuma aba do Chrome encontrada para profile=\"user\""
  - H2: Relacionados

## tools/browser-login.md

- Rota: /tools/browser-login
- Títulos:
  - H2: Login manual (recomendado)
  - H2: Qual perfil do Chrome é usado?
  - H2: X/Twitter: fluxo recomendado
  - H2: Sandboxing + acesso ao navegador do host
  - H2: Relacionados

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Rota: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Títulos:
  - H2: Escolha primeiro o modo de navegador correto
  - H3: Opção 1: CDP remoto bruto do WSL2 para o Windows
  - H3: Opção 2: Chrome MCP local do host
  - H2: Arquitetura funcional
  - H2: Por que esta configuração é confusa
  - H2: Regra crítica para a interface de controle
  - H2: Valide em camadas
  - H3: Camada 1: Verifique se o Chrome está servindo CDP no Windows
  - H3: Camada 2: Verifique se o WSL2 consegue alcançar esse endpoint do Windows
  - H3: Camada 3: Configure o perfil de navegador correto
  - H3: Camada 4: Verifique a camada da interface de controle separadamente
  - H3: Camada 5: Verifique o controle de navegador de ponta a ponta
  - H2: Erros enganosos comuns
  - H2: Checklist de triagem rápida
  - H2: Conclusão prática
  - H2: Relacionados

## tools/browser.md

- Rota: /tools/browser
- Títulos:
  - H2: O que você recebe
  - H2: Início rápido
  - H2: Controle de Plugin
  - H2: Orientação para agentes
  - H2: Comando ou ferramenta de navegador ausente
  - H2: Perfis: openclaw vs user
  - H2: Configuração
  - H3: Visão por captura de tela (suporte a modelo somente texto)
  - H2: Use Brave ou outro navegador baseado em Chromium
  - H2: Controle local vs remoto
  - H2: Proxy de navegador Node (padrão sem configuração)
  - H2: Browserless (CDP remoto hospedado)
  - H3: Docker Browserless no mesmo host
  - H2: Provedores CDP WebSocket diretos
  - H3: Browserbase
  - H3: Notte
  - H2: Segurança
  - H2: Perfis (vários navegadores)
  - H2: Sessão existente via Chrome DevTools MCP
  - H3: Inicialização personalizada do Chrome MCP
  - H2: Garantias de isolamento
  - H2: Seleção de navegador
  - H2: API de controle (opcional)
  - H2: Solução de problemas
  - H3: Falha de inicialização do CDP vs bloqueio SSRF de navegação
  - H2: Ferramentas de agente + como o controle funciona
  - H2: Relacionados

## tools/btw.md

- Rota: /tools/btw
- Títulos:
  - H2: O que ele faz
  - H2: O que ele não faz
  - H2: Como o contexto funciona
  - H2: Modelo de entrega
  - H2: Comportamento da superfície
  - H3: TUI
  - H3: Canais externos
  - H3: Interface de controle / web
  - H2: Quando usar o BTW
  - H2: Quando não usar o BTW
  - H2: Relacionados

## tools/capability-cookbook.md

- Rota: /tools/capability-cookbook
- Títulos:
  - H2: Relacionados

## tools/clawhub.md

- Rota: /tools/clawhub
- Títulos: nenhum

## tools/code-execution.md

- Rota: /tools/code-execution
- Títulos:
  - H2: Configuração
  - H2: Como usá-lo
  - H2: Erros
  - H2: Limites
  - H2: Relacionados

## tools/creating-skills.md

- Rota: /tools/creating-skills
- Títulos:
  - H2: Crie sua primeira skill
  - H2: Referência de SKILL.md
  - H3: Campos obrigatórios
  - H3: Chaves opcionais de frontmatter
  - H3: Usando {baseDir}
  - H2: Adicionar ativação condicional
  - H2: Propor via Skill Workshop
  - H2: Publicação no ClawHub
  - H2: Boas práticas
  - H2: Relacionados

## tools/diffs.md

- Rota: /tools/diffs
- Títulos:
  - H2: Início rápido
  - H2: Desativar orientação de sistema incorporada
  - H2: Fluxo de trabalho típico do agente
  - H2: Exemplos de entrada
  - H2: Referência de entrada da ferramenta
  - H2: Realce de sintaxe
  - H2: Contrato de detalhes de saída
  - H2: Seções inalteradas recolhidas
  - H2: Padrões de Plugin
  - H3: Configuração de URL persistente do visualizador
  - H2: Configuração de segurança
  - H2: Ciclo de vida e armazenamento de artefatos
  - H2: URL do visualizador e comportamento de rede
  - H2: Modelo de segurança
  - H2: Requisitos de navegador para modo de arquivo
  - H2: Solução de problemas
  - H2: Orientação operacional
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
  - H2: Disponibilidade e allowlists
  - H2: O que elevated não controla
  - H2: Relacionados

## tools/exa-search.md

- Rota: /tools/exa-search
- Títulos:
  - H2: Instalar Plugin
  - H2: Obter uma chave de API
  - H2: Configuração
  - H2: Substituição da URL base
  - H2: Parâmetros da ferramenta
  - H3: Extração de conteúdo
  - H3: Modos de busca
  - H2: Observações
  - H2: Relacionados

## tools/exec-approvals-advanced.md

- Rota: /tools/exec-approvals-advanced
- Títulos:
  - H2: Binários seguros (somente stdin)
  - H3: Validação de argv e flags negadas
  - H3: Diretórios de binários confiáveis
  - H3: Encadeamento de shell, wrappers e multiplexadores
  - H3: Binários seguros versus allowlist
  - H2: Comandos de interpretador/runtime
  - H3: Comportamento de entrega de follow-up
  - H2: Encaminhamento de aprovação para canais de chat
  - H3: Encaminhamento de aprovação por Plugin
  - H3: Aprovações no mesmo chat em qualquer canal
  - H3: Entrega nativa de aprovação
  - H3: Fluxo de IPC no macOS
  - H2: FAQ
  - H3: Quando accountId e threadId seriam usados em um destino de aprovação?
  - H3: Quando aprovações são enviadas a uma sessão, qualquer pessoa nessa sessão pode aprová-las?
  - H2: Relacionados

## tools/exec-approvals.md

- Rota: /tools/exec-approvals
- Títulos:
  - H2: Inspecionando a política efetiva
  - H2: Onde se aplica
  - H3: Modelo de confiança
  - H3: Divisão do macOS
  - H2: Configurações e armazenamento
  - H2: Ajustes de política
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Modo YOLO (sem aprovação)
  - H3: Configuração persistente de "never prompt" no host do Gateway
  - H3: Atalho local
  - H3: Host Node
  - H3: Atalho somente da sessão
  - H2: Allowlist (por agente)
  - H3: Restringindo argumentos com argPattern
  - H2: Permissão automática para CLIs de skill
  - H2: Binários seguros e encaminhamento de aprovação
  - H2: Edição na interface de controle
  - H2: Fluxo de aprovação
  - H2: Eventos do sistema
  - H2: Comportamento de aprovação negada
  - H2: Implicações
  - H2: Relacionados

## tools/exec.md

- Rota: /tools/exec
- Títulos:
  - H2: Parâmetros
  - H2: Configuração
  - H3: Tratamento de PATH
  - H2: Substituições de sessão (/exec)
  - H2: Modelo de autorização
  - H2: Aprovações de exec (aplicativo complementar / host node)
  - H2: Allowlist + binários seguros
  - H2: Exemplos
  - H2: applypatch
  - H2: Relacionados

## tools/firecrawl.md

- Rota: /tools/firecrawl
- Títulos:
  - H2: Instalar Plugin
  - H2: webfetch sem chave e chaves de API
  - H2: Configurar busca do Firecrawl
  - H2: Configurar fallback de webfetch do Firecrawl
  - H3: Firecrawl auto-hospedado
  - H2: Ferramentas do Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / contorno de bots
  - H2: Como webfetch usa Firecrawl
  - H2: Relacionados

## tools/gemini-search.md

- Rota: /tools/gemini-search
- Títulos:
  - H2: Obter uma chave de API
  - H2: Configuração
  - H2: Como funciona
  - H2: Parâmetros compatíveis
  - H2: Seleção de modelo
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
  - H2: TUI
  - H2: Comportamento de canal
  - H2: Solução de problemas
  - H2: Relacionados

## tools/grok-search.md

- Rota: /tools/grok-search
- Títulos:
  - H2: Integração inicial e configuração
  - H2: Faça login ou obtenha uma chave de API
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
  - H2: Capacidades dos provedores
  - H2: Parâmetros da ferramenta
  - H2: Configuração
  - H3: Seleção de modelo
  - H3: Ordem de seleção de provedor
  - H3: Edição de imagem
  - H2: Aprofundamentos por provedor
  - H2: Exemplos
  - H2: Relacionados

## tools/index.md

- Rota: /tools
- Títulos:
  - H2: Comece aqui
  - H2: Escolha ferramentas, Skills ou Plugins
  - H2: Categorias de ferramentas incorporadas
  - H2: Ferramentas fornecidas por Plugins
  - H2: Configurar acesso e aprovações
  - H2: Estender capacidades
  - H2: Solucionar ferramentas ausentes
  - H2: Relacionados

## tools/kimi-search.md

- Rota: /tools/kimi-search
- Títulos:
  - H2: Obter uma chave de API
  - H2: Configuração
  - H2: Como funciona
  - H2: Parâmetros compatíveis
  - H2: Relacionados

## tools/llm-task.md

- Rota: /tools/llm-task
- Títulos:
  - H2: Habilitar o Plugin
  - H2: Configuração (opcional)
  - H2: Parâmetros da ferramenta
  - H2: Saída
  - H2: Exemplo: etapa de fluxo de trabalho Lobster
  - H3: Limitação importante
  - H2: Observações de segurança
  - H2: Relacionados

## tools/lobster.md

- Rota: /tools/lobster
- Títulos:
  - H2: Hook
  - H2: Por quê
  - H2: Por que uma DSL em vez de programas simples?
  - H2: Como funciona
  - H2: Padrão: CLI pequena + pipes JSON + aprovações
  - H2: Etapas LLM somente JSON (llm-task)
  - H3: Limitação importante: Lobster incorporado vs openclaw.invoke
  - H2: Arquivos de fluxo de trabalho (.lobster)
  - H2: Instalar Lobster
  - H2: Habilitar a ferramenta
  - H2: Exemplo: triagem de email
  - H2: Parâmetros da ferramenta
  - H3: run
  - H3: resume
  - H3: Entradas opcionais
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
  - H2: Capacidades
  - H2: Matriz de capacidades de provedor
  - H2: Assíncrono vs síncrono
  - H2: Fala para texto e chamada de voz
  - H2: Mapeamentos de provedores (como fornecedores se dividem entre superfícies)
  - H2: Relacionado

## tools/minimax-search.md

- Rota: /tools/minimax-search
- Títulos:
  - H2: Obter uma credencial de plano de token
  - H2: Config
  - H2: Seleção de região
  - H2: Parâmetros compatíveis
  - H2: Relacionado

## tools/multi-agent-sandbox-tools.md

- Rota: /tools/multi-agent-sandbox-tools
- Títulos:
  - H2: Exemplos de configuração
  - H2: Precedência de configuração
  - H3: Configuração do sandbox
  - H3: Restrições de ferramentas
  - H2: Migração de agente único
  - H2: Exemplos de restrição de ferramentas
  - H2: Armadilha comum: "non-main"
  - H2: Testes
  - H2: Solução de problemas
  - H2: Relacionado

## tools/music-generation.md

- Rota: /tools/music-generation
- Títulos:
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H3: Matriz de capacidades
  - H2: Parâmetros da ferramenta
  - H2: Comportamento assíncrono
  - H3: Ciclo de vida da tarefa
  - H2: Configuração
  - H3: Seleção de modelo
  - H3: Ordem de seleção de provedores
  - H2: Observações sobre provedores
  - H2: Escolhendo o caminho certo
  - H2: Modos de capacidade de provedores
  - H2: Testes ao vivo
  - H2: Relacionado

## tools/ollama-search.md

- Rota: /tools/ollama-search
- Títulos:
  - H2: Configuração
  - H2: Config
  - H2: Observações
  - H2: Relacionado

## tools/parallel-search.md

- Rota: /tools/parallel-search
- Títulos:
  - H2: Instalar Plugin
  - H2: Chave de API (provedor pago)
  - H2: Config
  - H2: Substituição da URL base
  - H2: Parâmetros da ferramenta
  - H2: Observações
  - H2: Relacionado

## tools/pdf.md

- Rota: /tools/pdf
- Títulos:
  - H2: Disponibilidade
  - H2: Referência de entrada
  - H2: Referências PDF compatíveis
  - H2: Modos de execução
  - H3: Modo de provedor nativo
  - H3: Modo de fallback de extração
  - H2: Config
  - H2: Detalhes da saída
  - H2: Comportamento de erro
  - H2: Exemplos
  - H2: Relacionado

## tools/permission-modes.md

- Rota: /tools/permission-modes
- Títulos:
  - H2: Padrão recomendado
  - H2: Modos exec do host OpenClaw
  - H2: Mapeamento do Codex Guardian
  - H2: Permissões do harness ACPX
  - H2: Escolhendo um modo
  - H2: Relacionado

## tools/perplexity-search.md

- Rota: /tools/perplexity-search
- Títulos:
  - H2: Instalar Plugin
  - H2: Obtendo uma chave de API da Perplexity
  - H2: Compatibilidade com OpenRouter
  - H2: Exemplos de Config
  - H3: API de busca nativa da Perplexity
  - H3: Compatibilidade OpenRouter / Sonar
  - H2: Onde definir a chave
  - H2: Parâmetros da ferramenta
  - H3: Regras de filtro de domínio
  - H2: Observações
  - H2: Relacionado

## tools/plugin.md

- Rota: /tools/plugin
- Títulos:
  - H2: Requisitos
  - H2: Início rápido
  - H2: Configuração
  - H3: Escolha uma fonte de instalação
  - H3: Política de instalação do operador
  - H3: Configurar política de Plugin
  - H2: Entenda os formatos de Plugin
  - H2: Hooks de Plugin
  - H2: Verificar o Gateway ativo
  - H2: Solução de problemas
  - H3: Propriedade bloqueada do caminho do Plugin
  - H3: Configuração lenta de ferramentas do Plugin
  - H2: Relacionado

## tools/reactions.md

- Rota: /tools/reactions
- Títulos:
  - H2: Como funciona
  - H2: Comportamento do canal
  - H2: Nível de reação
  - H2: Relacionado

## tools/searxng-search.md

- Rota: /tools/searxng-search
- Títulos:
  - H2: Configuração
  - H2: Config
  - H2: Variável de ambiente
  - H2: Referência de Config do Plugin
  - H2: Observações
  - H2: Relacionado

## tools/skill-workshop.md

- Rota: /tools/skill-workshop
- Títulos:
  - H2: Como funciona
  - H2: Ciclo de vida
  - H2: Chat
  - H2: CLI
  - H2: Conteúdo da proposta
  - H2: Arquivos de suporte
  - H2: Ferramenta do agente
  - H2: Aprovação e autonomia
  - H2: Métodos do Gateway
  - H2: Armazenamento
  - H2: Limites
  - H2: Solução de problemas
  - H2: Relacionado

## tools/skills-config.md

- Rota: /tools/skills-config
- Títulos:
  - H2: Carregamento (skills.load)
  - H2: Instalar (skills.install)
  - H2: Política de instalação do operador (security.installPolicy)
  - H2: Lista de permissões de skill incluída
  - H2: Entradas por skill (skills.entries)
  - H2: Listas de permissões de agentes (agents)
  - H2: Workshop (skills.workshop)
  - H2: Raízes de skill com link simbólico
  - H2: Skills em sandbox e variáveis de ambiente
  - H2: Lembrete da ordem de carregamento
  - H2: Relacionado

## tools/skills.md

- Rota: /tools/skills
- Títulos:
  - H2: Ordem de carregamento
  - H2: Skills por agente vs compartilhadas
  - H2: Listas de permissões de agentes
  - H2: Plugins e skills
  - H2: Skill Workshop
  - H2: Instalando do ClawHub
  - H2: Segurança
  - H2: Formato SKILL.md
  - H3: Chaves opcionais de frontmatter
  - H2: Gating
  - H3: Especificações do instalador
  - H2: Substituições de Config
  - H2: Injeção de ambiente
  - H2: Snapshots e atualização
  - H2: Impacto de tokens
  - H2: Relacionado

## tools/slash-commands.md

- Rota: /tools/slash-commands
- Títulos:
  - H2: Três tipos de comando
  - H2: Configuração
  - H2: Lista de comandos
  - H3: Comandos principais
  - H3: Comandos do dock
  - H3: Comandos de Plugins incluídos
  - H3: Comandos de Skills
  - H2: /tools — o que o agente pode usar agora
  - H2: /model — seleção de modelo
  - H2: /config — gravações de Config em disco
  - H2: /mcp — Config do servidor MCP
  - H2: /debug — substituições somente em runtime
  - H2: /plugins — gerenciamento de Plugins
  - H2: /trace — saída de rastreamento do Plugin
  - H2: /btw — perguntas paralelas
  - H2: Observações de superfície
  - H2: Uso e status do provedor
  - H2: Relacionado

## tools/steer.md

- Rota: /tools/steer
- Títulos:
  - H2: Sessão atual
  - H2: Steer vs fila
  - H2: Subagentes
  - H2: Sessões ACP
  - H2: Relacionado

## tools/subagents.md

- Rota: /tools/subagents
- Títulos:
  - H2: Comando slash
  - H3: Controles de vinculação de thread
  - H3: Comportamento de spawn
  - H2: Modos de contexto
  - H2: Ferramenta: sessionsspawn
  - H3: Modo de prompt de delegação
  - H3: Parâmetros da ferramenta
  - H3: Nomes de tarefas e direcionamento
  - H2: Ferramenta: sessionsyield
  - H2: Ferramenta: subagents
  - H2: Sessões vinculadas a threads
  - H3: Canais com suporte a threads
  - H3: Fluxo rápido
  - H3: Controles manuais
  - H3: Opções de Config
  - H3: Lista de permissões
  - H3: Descoberta
  - H3: Arquivamento automático
  - H2: Subagentes aninhados
  - H3: Níveis de profundidade
  - H3: Cadeia de anúncio
  - H3: Política de ferramentas por profundidade
  - H3: Limite de spawn por agente
  - H3: Parada em cascata
  - H2: Autenticação
  - H2: Anúncio
  - H3: Contexto do anúncio
  - H3: Linha de estatísticas
  - H3: Por que preferir sessionshistory
  - H2: Política de ferramentas
  - H3: Substituir via Config
  - H2: Concorrência
  - H2: Liveness e recuperação
  - H2: Interrompendo
  - H2: Limitações
  - H2: Relacionado

## tools/tavily.md

- Rota: /tools/tavily
- Títulos:
  - H2: Primeiros passos
  - H2: Referência da ferramenta
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Escolhendo a ferramenta certa
  - H2: Configuração avançada
  - H2: Relacionado

## tools/thinking.md

- Rota: /tools/thinking
- Títulos:
  - H2: O que faz
  - H2: Ordem de resolução
  - H2: Definindo um padrão de sessão
  - H2: Aplicação por agente
  - H2: Modo rápido (/fast)
  - H2: Diretivas detalhadas (/verbose ou /v)
  - H2: Diretivas de rastreamento de Plugin (/trace)
  - H2: Visibilidade do raciocínio (/reasoning)
  - H2: Relacionado
  - H2: Heartbeats
  - H2: UI de chat web
  - H2: Perfis de provedor

## tools/tokenjuice.md

- Rota: /tools/tokenjuice
- Títulos:
  - H2: Habilitar o Plugin
  - H2: O que tokenjuice muda
  - H2: Verificar se está funcionando
  - H2: Desabilitar o Plugin
  - H2: Relacionado

## tools/tool-search.md

- Rota: /tools/tool-search
- Títulos:
  - H2: Como um turno é executado
  - H2: Modos
  - H2: Por que isso existe
  - H2: API
  - H2: Limite de runtime
  - H2: Config
  - H2: Prompt e telemetria
  - H2: Validação E2E
  - H2: Comportamento de falha
  - H2: Relacionado

## tools/trajectory.md

- Rota: /tools/trajectory
- Títulos:
  - H2: Início rápido
  - H2: Acesso
  - H2: O que é registrado
  - H2: Arquivos do pacote
  - H2: Local de captura
  - H2: Desabilitar captura
  - H2: Ajustar timeout de flush
  - H2: Privacidade e limites
  - H2: Solução de problemas
  - H2: Relacionado

## tools/tts.md

- Rota: /tools/tts
- Títulos:
  - H2: Início rápido
  - H2: Provedores compatíveis
  - H2: Configuração
  - H3: Substituições de voz por agente
  - H2: Personas
  - H3: Persona mínima
  - H3: Persona completa (prompt neutro em relação ao provedor)
  - H3: Resolução de persona
  - H3: Como os provedores usam prompts de persona
  - H3: Política de fallback
  - H2: Diretivas orientadas por modelo
  - H2: Comandos slash
  - H2: Preferências por usuário
  - H2: Formatos de saída (fixos)
  - H2: Comportamento de TTS automático
  - H2: Formatos de saída por canal
  - H2: Referência de campos
  - H2: Ferramenta do agente
  - H2: RPC do Gateway
  - H2: Links de serviço
  - H2: Relacionado

## tools/video-generation.md

- Rota: /tools/video-generation
- Títulos:
  - H2: Início rápido
  - H2: Como a geração assíncrona funciona
  - H3: Ciclo de vida da tarefa
  - H2: Provedores compatíveis
  - H3: Matriz de capacidades
  - H2: Parâmetros da ferramenta
  - H3: Obrigatório
  - H3: Entradas de conteúdo
  - H3: Controles de estilo
  - H3: Avançado
  - H4: Fallback e opções tipadas
  - H2: Ações
  - H2: Seleção de modelo
  - H2: Observações sobre provedores
  - H2: Modos de capacidade de provedores
  - H2: Testes ao vivo
  - H2: Configuração
  - H2: Relacionado

## tools/web-fetch.md

- Rota: /tools/web-fetch
- Títulos:
  - H2: Início rápido
  - H2: Parâmetros da ferramenta
  - H2: Como funciona
  - H2: Atualizações de progresso
  - H2: Config
  - H2: Fallback do Firecrawl
  - H2: Proxy env confiável
  - H2: Limites e segurança
  - H2: Perfis de ferramenta
  - H2: Relacionado

## tools/web.md

- Rota: /tools/web
- Títulos:
  - H2: Início rápido
  - H2: Escolhendo um provedor
  - H3: Comparação de provedores
  - H2: Detecção automática
  - H2: Busca web nativa da OpenAI
  - H2: Busca web nativa do Codex
  - H2: Segurança de rede
  - H2: Configurando busca web
  - H2: Config
  - H3: Armazenando chaves de API
  - H2: Parâmetros da ferramenta
  - H2: xsearch
  - H3: Config do xsearch
  - H3: Parâmetros do xsearch
  - H3: Exemplo de xsearch
  - H2: Exemplos
  - H2: Perfis de ferramenta
  - H2: Relacionado

## tts.md

- Rota: /tts
- Títulos:
  - H2: Relacionado

## vps.md

- Rota: /vps
- Títulos:
  - H2: Escolha um provedor
  - H2: Como configurações em nuvem funcionam
  - H2: Proteja o acesso de administrador primeiro
  - H2: Agente compartilhado da empresa em uma VPS
  - H2: Usando nós com uma VPS
  - H2: Ajuste de inicialização para VMs pequenas e hosts ARM
  - H3: Checklist de ajuste do systemd (opcional)
  - H2: Relacionado

## web/control-ui.md

- Rota: /web/control-ui
- Títulos:
  - H2: Abertura rápida (local)
  - H2: Pareamento de dispositivo (primeira conexão)
  - H2: Identidade pessoal (local do navegador)
  - H2: Endpoint de Config de runtime
  - H2: Suporte a idiomas
  - H2: Temas de aparência
  - H2: O que ele pode fazer (hoje)
  - H2: Página MCP
  - H2: Aba de atividade
  - H2: Comportamento do chat
  - H2: Instalação de PWA e push web
  - H2: Embeds hospedados
  - H2: Largura da mensagem de chat
  - H2: Acesso por Tailnet (recomendado)
  - H2: HTTP inseguro
  - H2: Política de segurança de conteúdo
  - H2: Autenticação da rota de avatar
  - H2: Autenticação da rota de mídia do assistente
  - H2: Construindo a UI
  - H2: Página em branco da Control UI
  - H2: Depuração/testes: servidor de desenvolvimento + Gateway remoto
  - H2: Relacionado

## web/dashboard.md

- Rota: /web/dashboard
- Títulos:
  - H2: Caminho rápido (recomendado)
  - H2: Fundamentos de autenticação (local vs remoto)
  - H2: Se você vir "unauthorized" / 1008
  - H2: Relacionado

## web/index.md

- Rota: /web
- Títulos:
  - H2: Webhooks
  - H2: RPC HTTP de administrador
  - H2: Config (ativado por padrão)
  - H2: Acesso por Tailscale
  - H3: Integrated Serve (recomendado)
  - H3: Bind de Tailnet + token
  - H3: Internet pública (Funnel)
  - H2: Observações de segurança
  - H2: Construindo a UI

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
  - H2: Comandos slash
  - H2: Comandos de shell locais
  - H2: Reparar configurações a partir da TUI local
  - H2: Saída da ferramenta
  - H2: Cores do terminal
  - H2: Histórico + streaming
  - H2: Detalhes de conexão
  - H2: Opções
  - H2: Solução de problemas
  - H2: Solução de problemas de conexão
  - H2: Relacionado

## web/webchat.md

- Rota: /web/webchat
- Títulos:
  - H2: O que é
  - H2: Início rápido
  - H2: Como funciona (comportamento)
  - H3: Transcrição e modelo de entrega
  - H2: Painel de ferramentas dos agentes da Control UI
  - H2: Uso remoto
  - H2: Referência de configuração (WebChat)
  - H2: Relacionado
