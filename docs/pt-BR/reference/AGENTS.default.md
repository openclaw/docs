---
read_when:
    - Iniciando uma nova sessão de agente do OpenClaw
    - Ativação ou auditoria das Skills padrão
summary: Instruções padrão do agente OpenClaw e lista de Skills para a configuração do assistente pessoal
title: AGENTS.md padrão
x-i18n:
    generated_at: "2026-07-12T00:21:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Primeira execução (recomendado)

Os agentes do OpenClaw usam um diretório de espaço de trabalho. Padrão: `~/.openclaw/workspace` (configurável por meio de `agents.defaults.workspace`, com suporte a `~`).

1. Crie o espaço de trabalho:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copie para ele os modelos padrão do espaço de trabalho:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: use a lista de Skills de assistente pessoal deste arquivo em vez do modelo genérico:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcional: aponte para outro espaço de trabalho:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Padrões de segurança

- Não despeje diretórios nem segredos no chat.
- Não execute comandos destrutivos, a menos que isso seja solicitado explicitamente.
- Antes de alterar configurações ou agendadores (crontab, unidades do systemd, configurações do nginx, arquivos rc do shell), inspecione primeiro o estado existente e, por padrão, preserve ou mescle o conteúdo.
- Não envie respostas parciais ou em streaming para serviços externos de mensagens (envie apenas respostas finais).

## Verificação prévia de soluções existentes

Antes de propor ou criar um sistema, recurso, fluxo de trabalho, ferramenta, integração ou automação personalizados, verifique se há projetos de código aberto, bibliotecas mantidas, plugins existentes do OpenClaw ou plataformas gratuitas que já resolvam o problema de forma satisfatória. Dê preferência a essas opções quando forem adequadas. Crie algo personalizado somente quando as opções existentes forem inadequadas, caras demais, não mantidas, inseguras, não conformes ou quando o usuário solicitar explicitamente uma solução personalizada. Evite recomendar serviços pagos, a menos que o usuário aprove explicitamente o gasto. Mantenha essa verificação simples: uma etapa preliminar, não uma tarefa de pesquisa.

## Início da sessão (obrigatório)

- Leia `SOUL.md`, `USER.md` e os arquivos de hoje e ontem em `memory/` antes de responder.
- Leia `MEMORY.md` quando estiver presente.

## Essência (obrigatório)

- `SOUL.md` define identidade, tom e limites. Mantenha-o atualizado.
- Se você alterar `SOUL.md`, informe o usuário.
- Você é uma nova instância a cada sessão; a continuidade reside nesses arquivos.

## Espaços compartilhados (recomendado)

- Você não fala em nome do usuário; tenha cuidado em chats em grupo ou canais públicos.
- Não compartilhe dados privados, informações de contato nem anotações internas.

## Sistema de memória (recomendado)

- Registro diário: `memory/YYYY-MM-DD.md` (crie `memory/` se necessário).
- Memória de longo prazo: `MEMORY.md` para fatos, preferências e decisões duradouros.
- `memory.md` em minúsculas serve apenas como entrada para reparo legado; não mantenha deliberadamente os dois arquivos no diretório raiz.
- No início da sessão, leia os arquivos de hoje e ontem, além de `MEMORY.md` quando estiver presente.
- Antes de gravar arquivos de memória, leia-os primeiro; registre apenas atualizações concretas, nunca marcadores de posição vazios.
- Registre: decisões, preferências, restrições e pendências.
- Evite segredos, a menos que sejam solicitados explicitamente.

## Ferramentas e Skills

- As ferramentas ficam nas Skills; siga o `SKILL.md` de cada Skill quando precisar usá-la.
- Mantenha observações específicas do ambiente em `TOOLS.md` (observações para as Skills).

## Dica de backup (recomendado)

Trate este espaço de trabalho como a memória do assistente: transforme-o em um repositório git (de preferência privado) para manter backups de `AGENTS.md` e dos arquivos de memória.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Opcional: adicione um repositório remoto privado e envie as alterações
```

## O que o OpenClaw faz

- Executa um Gateway de canais de mensagens (WhatsApp, Telegram, Discord, Signal, iMessage, Slack e outros) junto com um agente integrado, permitindo que o assistente leia e escreva em chats, obtenha contexto e execute Skills por meio da máquina host.
- O aplicativo para macOS gerencia permissões (gravação da tela, notificações e microfone) e disponibiliza a CLI `openclaw` por meio do binário incluído.
- Por padrão, os chats diretos são agrupados na sessão `main` do agente; grupos e canais/salas recebem suas próprias chaves de sessão. Consulte [Roteamento de canais](/pt-BR/channels/channel-routing) para ver os formatos exatos das chaves. Heartbeats mantêm as tarefas em segundo plano ativas.

## Skills principais (ative em Settings → Skills)

Exemplo de lista para um espaço de trabalho de assistente pessoal; substitua pelas Skills adequadas à sua configuração.

- **mcporter** - ambiente de execução/CLI de servidor de ferramentas para gerenciar back-ends externos de Skills.
- **Peekaboo** - capturas de tela rápidas no macOS com análise visual opcional por IA.
- **camsnap** - captura quadros, clipes ou alertas de movimento de câmeras de segurança RTSP/ONVIF.
- **oracle** - CLI de agente compatível com OpenAI, com reprodução de sessões e controle do navegador.
- **eightctl** - controle seu sono pelo terminal.
- **imsg** - envia, lê e transmite mensagens do iMessage e SMS.
- **wacli** - CLI do WhatsApp: sincroniza, pesquisa e envia.
- **discord** - ações do Discord: reações, figurinhas e enquetes. Use destinos `user:<id>` ou `channel:<id>` (IDs numéricos isolados são ambíguos).
- **gog** - CLI do Google Suite: Gmail, Agenda, Drive e Contatos.
- **spotify-player** - cliente do Spotify para terminal que pesquisa, adiciona itens à fila e controla a reprodução.
- **sag** - síntese de voz do ElevenLabs com experiência semelhante ao comando `say` do macOS; transmite para os alto-falantes por padrão.
- **Sonos CLI** - controla alto-falantes Sonos (descoberta/status/reprodução/volume/agrupamento) por meio de scripts.
- **blucli** - reproduz, agrupa e automatiza players BluOS por meio de scripts.
- **OpenHue CLI** - controla a iluminação Philips Hue para cenas e automações.
- **OpenAI Whisper** - conversão local de fala em texto para ditados rápidos e transcrições de mensagens de voz.
- **Gemini CLI** - modelos Google Gemini pelo terminal para perguntas e respostas rápidas.
- **agent-tools** - kit de utilitários para automações e scripts auxiliares.

## Observações de uso

- Prefira a CLI `openclaw` para scripts; o aplicativo para desktop gerencia as permissões.
- Execute as instalações pela aba Skills; o botão de instalação fica oculto quando um binário obrigatório já está presente.
- Mantenha os Heartbeats ativados para que o assistente possa agendar lembretes, monitorar caixas de entrada e acionar capturas de câmera.
- A interface Canvas é executada em tela cheia com sobreposições nativas. Evite posicionar controles essenciais nos cantos superior esquerdo e superior direito ou nas bordas inferiores; adicione margens explícitas ao layout em vez de depender dos recuos da área segura.
- Para verificações controladas pelo navegador, use a CLI `openclaw browser` (Plugin `browser` incluído) com o perfil do Chrome/Brave/Edge/Chromium gerenciado pelo OpenClaw.
- Gerenciamento: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Inspeção: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Ações: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. As ações precisam de uma `ref` obtida por meio de `snapshot` (seletores CSS não são aceitos para ações); use `evaluate` quando precisar de um direcionamento no estilo de `document.querySelector`.
- Adicione `--json` a qualquer comando de inspeção para obter uma saída legível por máquina.

## Relacionado

- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
- [Ambiente de execução do agente](/pt-BR/concepts/agent)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
