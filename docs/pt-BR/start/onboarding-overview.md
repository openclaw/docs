---
read_when:
    - Escolha de um caminho de integração
    - Configurando um novo ambiente
sidebarTitle: Onboarding Overview
summary: Visão geral das opções e dos fluxos de integração do OpenClaw
title: Visão geral da integração inicial
x-i18n:
    generated_at: "2026-07-16T13:00:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

O OpenClaw oferece integração inicial pelo terminal e pelo aplicativo para macOS. Ambos estabelecem primeiro a inferência:
detectam o acesso existente à IA, exigem uma conclusão em tempo real e, somente então, iniciam
o OpenClaw para definir o restante da configuração. Um Gateway acessível e configurado,
cujo agente padrão já tenha um modelo configurado, ignora a integração inicial e abre
a interface normal do agente. O fluxo pelo terminal também oferece o assistente clássico completo para
uma configuração detalhada.

## Qual caminho devo usar?

|                | Integração inicial pela CLI                         | Integração inicial pelo aplicativo para macOS           |
| -------------- | -------------------------------------- | ------------------------------ |
| **Plataformas**  | macOS, Linux, Windows (nativo ou WSL2) | Somente macOS                     |
| **Interface**  | Configuração da inferência e, depois, OpenClaw         | Configuração da inferência e, depois, OpenClaw |
| **Mais indicado para**   | Servidores, ambientes sem interface gráfica, controle total        | Mac desktop, configuração visual      |
| **Automação** | `--non-interactive` para scripts        | Somente manual                    |
| **Comando**    | `openclaw onboard`                     | Iniciar o aplicativo                 |

A maioria dos usuários deve começar com a **integração inicial pela CLI** — ela funciona em qualquer ambiente e oferece
mais controle.

## O que a integração inicial configura

A fase guiada de inferência estabelece somente:

1. **Provedor do modelo e autenticação** — acesso detectado ou login verificado no provedor,
   chave de API ou token
2. **Inferência verificada** — uma conclusão real no modelo efetivo
   do agente padrão

Após a aprovação dessa conclusão, o OpenClaw pode configurar o espaço de trabalho, o Gateway,
o serviço do Gateway, os canais, os agentes, os plugins e outros recursos opcionais.

O assistente clássico da CLI também pode configurar:

1. **Canais** (opcional) — canais de chat integrados e incluídos, como
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   Telegram, WhatsApp e outros
2. **Controles avançados do Gateway** — modo remoto, configurações de rede e opções de daemon

## Integração inicial pela CLI

Execute em qualquer terminal:

```bash
openclaw onboard
```

O fluxo guiado detecta o acesso existente à IA, testa os candidatos em tempo real na ordem
e passa ao próximo em caso de falha. Se todas as opções detectadas forem esgotadas, ele mostra primeiro OpenAI,
Anthropic, xAI (Grok), Google e OpenRouter. **More…** contém os
demais provedores organizados em grupos, com regiões, planos e métodos compatíveis
de navegador, dispositivo, chave de API ou token em um segundo menu. Ele salva o modelo
e a credencial somente após uma conclusão bem-sucedida e, depois, inicia o OpenClaw para
configurar o espaço de trabalho, o Gateway, os canais, os agentes, os plugins e outros recursos
opcionais. **Skip for now** encerra sem iniciar o OpenClaw. Não há
transição para o fluxo clássico durante o processo; encerre e execute `openclaw onboard --classic` quando preferir
usar o assistente clássico.

Após a aprovação da inferência, o OpenClaw pode encaminhar a configuração de canais para um assistente
de terminal com entrada mascarada. Ele não abre a configuração guiada nem clássica do provedor; encerre o OpenClaw e
execute `openclaw onboard` para alterar o provedor do modelo ou sua autenticação.

Use `openclaw onboard --classic` para configurar detalhadamente o modelo/autenticação, os canais, as Skills,
o Gateway remoto ou a importação. Adicionar `--install-daemon` também seleciona o
fluxo clássico e instala o serviço em segundo plano em uma única etapa. Use `openclaw
openclaw` para configuração e reparo conversacionais não relacionados à inferência. `openclaw
onboard --modern` é um alias de compatibilidade que usa a mesma verificação
de inferência em tempo real.

Referência completa: [Integração inicial (CLI)](/pt-BR/start/wizard)
Documentação do comando da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)

## Integração inicial pelo aplicativo para macOS

Abra o aplicativo OpenClaw. Se o Gateway local ou remoto configurado estiver acessível
e o agente padrão já tiver um modelo configurado, o aplicativo ignora a integração inicial
e o OpenClaw e abre imediatamente a interface normal do agente.

Para um Gateway novo ou incompleto, o fluxo da primeira execução detecta o acesso existente à IA
(Claude Code, Codex ou chaves de API), testa em tempo real a melhor
opção e a salva somente após uma resposta real — recorrendo automaticamente às alternativas e
oferecendo uma etapa manual verificada de chave de API quando nada é encontrado. As credenciais
confidenciais usam entrada mascarada. Quando a inferência é aprovada, o OpenClaw é iniciado e
ajuda a configurar o restante.

A CLI do Gemini continua disponível para agentes normais após a configuração, mas não é
oferecida para essa verificação de inferência porque não pode impor a sondagem sem ferramentas.

Referência completa: [Integração inicial (aplicativo para macOS)](/pt-BR/start/onboarding)

## Provedores personalizados ou não listados

Se o seu provedor não estiver listado, execute `openclaw onboard --classic`, escolha
**Custom Provider** e informe:

- Compatibilidade do endpoint: compatível com OpenAI (`/chat/completions`), compatível com OpenAI Responses (`/responses`), compatível com Anthropic (`/messages`) ou desconhecida (sonda os três e detecta automaticamente)
- URL base e chave de API (a chave de API é opcional se o endpoint não exigir uma)
- ID do modelo e alias opcional do modelo

Vários endpoints personalizados podem coexistir — cada um recebe seu próprio ID de endpoint.

## Relacionados

- [Primeiros passos](/pt-BR/start/getting-started)
- [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference)
