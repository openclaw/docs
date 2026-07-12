---
read_when:
    - Escolhendo um caminho de integração
    - Configurando um novo ambiente
sidebarTitle: Onboarding Overview
summary: Visão geral das opções e dos fluxos de integração do OpenClaw
title: Visão geral da integração inicial
x-i18n:
    generated_at: "2026-07-12T00:22:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

O OpenClaw oferece integração inicial pelo terminal e pelo aplicativo para macOS. Ambos estabelecem primeiro a inferência:
detectam o acesso existente à IA, exigem uma conclusão real e somente então iniciam
o Crestodian para definir o restante da configuração. Um Gateway acessível e configurado,
cujo agente padrão já tenha um modelo configurado, ignora a integração inicial e abre
a interface normal do agente. O fluxo do terminal também oferece o assistente clássico completo para
uma configuração detalhada.

## Qual caminho devo usar?

|                | Integração inicial pela CLI                    | Integração inicial pelo aplicativo para macOS |
| -------------- | ---------------------------------------------- | --------------------------------------------- |
| **Plataformas** | macOS, Linux, Windows (nativo ou WSL2)        | Somente macOS                                 |
| **Interface**  | Configuração da inferência, depois Crestodian  | Configuração da inferência, depois Crestodian |
| **Mais indicado para** | Servidores, ambientes sem interface gráfica, controle total | Mac de mesa, configuração visual |
| **Automação**  | `--non-interactive` para scripts               | Somente manual                                |
| **Comando**    | `openclaw onboard`                             | Iniciar o aplicativo                          |

A maioria dos usuários deve começar pela **integração inicial pela CLI** — ela funciona em qualquer lugar e oferece
mais controle.

## O que a integração inicial configura

A fase guiada de inferência estabelece somente:

1. **Provedor do modelo e autenticação** — acesso detectado ou uma chave de API verificada
2. **Inferência verificada** — uma conclusão real usando o modelo efetivo
   do agente padrão

Depois que essa conclusão for aprovada, o Crestodian poderá configurar o espaço de trabalho, o Gateway,
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

O fluxo guiado detecta o acesso existente à IA, testa os candidatos ao vivo em sequência,
passa para o próximo em caso de falha e oferece a inserção manual mascarada da chave. Ele salva o
modelo e a credencial somente após uma conclusão aprovada e, em seguida, inicia o Crestodian
para configurar o espaço de trabalho, o Gateway, os canais, os agentes, os plugins e outros
recursos opcionais. Não há Crestodian antes da inferência, caminho para ignorar a IA nem
transferência para o fluxo clássico durante o processo. Saia e execute `openclaw onboard --classic` quando
quiser usar o assistente clássico.

Após a inferência ser aprovada, o Crestodian pode transferir a configuração dos canais para um assistente
de terminal com entrada mascarada. Ele não abre a configuração guiada nem clássica do provedor; saia do Crestodian e
execute `openclaw onboard` para alterar o provedor do modelo ou sua autenticação.

Use `openclaw onboard --classic` para a configuração detalhada de modelo/autenticação, canais, Skills,
Gateway remoto ou importação. Adicionar `--install-daemon` também seleciona o
fluxo clássico e instala o serviço em segundo plano em uma única etapa. Use `openclaw
crestodian` para configuração e reparo conversacionais não relacionados à inferência. `openclaw
onboard --modern` é um alias de compatibilidade que usa a mesma validação de inferência
ao vivo.

Referência completa: [Integração inicial (CLI)](/pt-BR/start/wizard)
Documentação do comando da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)

## Integração inicial pelo aplicativo para macOS

Abra o aplicativo OpenClaw. Se o Gateway local ou remoto configurado estiver acessível
e o agente padrão já tiver um modelo configurado, o aplicativo ignorará a integração inicial
e o Crestodian e abrirá imediatamente a interface normal do agente.

Para um Gateway novo ou incompleto, o fluxo da primeira execução detecta o acesso existente à IA
(Claude Code, Codex ou chaves de API), testa ao vivo a melhor
opção e a salva somente após uma resposta real — recorrendo automaticamente às alternativas e
oferecendo uma etapa verificada de inserção manual da chave de API quando nada for encontrado. As
credenciais confidenciais usam entrada mascarada. Assim que a inferência for aprovada, o Crestodian será iniciado e
ajudará a configurar o restante.

A Gemini CLI continua disponível para agentes normais após a configuração, mas não é
oferecida para essa validação de inferência porque não consegue impor a sondagem sem ferramentas.

Referência completa: [Integração inicial (aplicativo para macOS)](/pt-BR/start/onboarding)

## Provedores personalizados ou não listados

Se seu provedor não estiver listado, execute `openclaw onboard --classic`, escolha
**Provedor personalizado** e informe:

- Compatibilidade do endpoint: compatível com OpenAI (`/chat/completions`), compatível com OpenAI Responses (`/responses`), compatível com Anthropic (`/messages`) ou desconhecida (sonda os três e detecta automaticamente)
- URL base e chave de API (a chave de API é opcional se o endpoint não exigir uma)
- ID do modelo e alias opcional do modelo

Vários endpoints personalizados podem coexistir — cada um recebe seu próprio ID de endpoint.

## Relacionados

- [Primeiros passos](/pt-BR/start/getting-started)
- [Referência de configuração pela CLI](/pt-BR/start/wizard-cli-reference)
