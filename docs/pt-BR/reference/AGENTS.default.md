---
read_when:
    - Iniciando uma nova sessão de agente do OpenClaw
    - Habilitando ou auditando Skills padrão
summary: Instruções padrão do agente OpenClaw e lista de Skills para a configuração de assistente pessoal
title: AGENTS.md padrão
x-i18n:
    generated_at: "2026-04-24T06:10:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Assistente pessoal OpenClaw (padrão)

## Primeira execução (recomendado)

O OpenClaw usa um diretório de workspace dedicado para o agente. Padrão: `~/.openclaw/workspace` (configurável via `agents.defaults.workspace`).

1. Crie o workspace (se ele ainda não existir):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copie os templates padrão de workspace para o workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: se você quiser a lista de Skills do assistente pessoal, substitua AGENTS.md por este arquivo:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcional: escolha um workspace diferente definindo `agents.defaults.workspace` (aceita `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Padrões de segurança

- Não despeje diretórios ou segredos no chat.
- Não execute comandos destrutivos, a menos que isso seja solicitado explicitamente.
- Não envie respostas parciais/em streaming para superfícies externas de mensagens (somente respostas finais).

## Início da sessão (obrigatório)

- Leia `SOUL.md`, `USER.md` e hoje+ontem em `memory/`.
- Leia `MEMORY.md` quando existir.
- Faça isso antes de responder.

## Soul (obrigatório)

- `SOUL.md` define identidade, tom e limites. Mantenha-o atualizado.
- Se você alterar `SOUL.md`, avise o usuário.
- Você é uma instância nova a cada sessão; a continuidade vive nesses arquivos.

## Espaços compartilhados (recomendado)

- Você não é a voz do usuário; tenha cuidado em chats em grupo ou canais públicos.
- Não compartilhe dados privados, informações de contato ou notas internas.

## Sistema de memória (recomendado)

- Log diário: `memory/YYYY-MM-DD.md` (crie `memory/` se necessário).
- Memória de longo prazo: `MEMORY.md` para fatos, preferências e decisões duráveis.
- `memory.md` em minúsculas é apenas entrada de reparo legada; não mantenha os dois arquivos raiz intencionalmente.
- No início da sessão, leia hoje + ontem + `MEMORY.md` quando existir.
- Capture: decisões, preferências, restrições, ciclos em aberto.
- Evite segredos, a menos que seja solicitado explicitamente.

## Ferramentas e Skills

- Ferramentas vivem em Skills; siga `SKILL.md` de cada Skill quando precisar dela.
- Mantenha notas específicas do ambiente em `TOOLS.md` (Notas para Skills).

## Dica de backup (recomendado)

Se você tratar este workspace como a “memória” do Clawd, transforme-o em um repositório git (de preferência privado) para que `AGENTS.md` e seus arquivos de memória tenham backup.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Opcional: adicione um remote privado + faça push
```

## O que o OpenClaw faz

- Executa gateway do WhatsApp + agente de coding Pi para que o assistente possa ler/escrever chats, buscar contexto e executar Skills pelo Mac host.
- O app do macOS gerencia permissões (gravação de tela, notificações, microfone) e expõe a CLI `openclaw` pelo binário incluído.
- Chats diretos são reduzidos por padrão à sessão `main` do agente; grupos permanecem isolados como `agent:<agentId>:<channel>:group:<id>` (salas/canais: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats mantêm tarefas em segundo plano ativas.

## Skills centrais (habilite em Settings → Skills)

- **mcporter** — Runtime/CLI de servidor de ferramentas para gerenciar backends externos de Skill.
- **Peekaboo** — Capturas de tela rápidas no macOS com análise opcional de visão por IA.
- **camsnap** — Captura frames, clipes ou alertas de movimento de câmeras de segurança RTSP/ONVIF.
- **oracle** — CLI de agente pronto para OpenAI com replay de sessão e controle de navegador.
- **eightctl** — Controle seu sono pelo terminal.
- **imsg** — Envie, leia e faça streaming de iMessage e SMS.
- **wacli** — CLI do WhatsApp: sincronizar, pesquisar, enviar.
- **discord** — Ações do Discord: reagir, stickers, polls. Use destinos `user:<id>` ou `channel:<id>` (IDs numéricos sem prefixo são ambíguos).
- **gog** — CLI do Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Cliente Spotify de terminal para pesquisar/enfileirar/controlar reprodução.
- **sag** — Fala do ElevenLabs com UX estilo say do Mac; faz streaming para alto-falantes por padrão.
- **Sonos CLI** — Controle alto-falantes Sonos (discover/status/playback/volume/grouping) por scripts.
- **blucli** — Reproduza, agrupe e automatize players BluOS por scripts.
- **OpenHue CLI** — Controle de iluminação Philips Hue para cenas e automações.
- **OpenAI Whisper** — Speech-to-text local para ditado rápido e transcrições de correio de voz.
- **Gemini CLI** — Modelos Google Gemini no terminal para perguntas e respostas rápidas.
- **agent-tools** — Kit de utilitários para automações e scripts auxiliares.

## Observações de uso

- Prefira a CLI `openclaw` para scripting; o app do Mac cuida das permissões.
- Execute instalações pela aba Skills; ela oculta o botão se um binário já estiver presente.
- Mantenha Heartbeats habilitados para que o assistente possa agendar lembretes, monitorar caixas de entrada e acionar capturas de câmera.
- A UI Canvas é executada em tela cheia com overlays nativos. Evite colocar controles críticos nos cantos superior esquerdo/superior direito/bordas inferiores; adicione gutters explícitos ao layout e não dependa de safe-area insets.
- Para verificação orientada por navegador, use `openclaw browser` (tabs/status/screenshot) com o perfil Chrome gerenciado pelo OpenClaw.
- Para inspeção de DOM, use `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando precisar de saída para máquina).
- Para interações, use `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type exigem refs de snapshot; use `evaluate` para seletores CSS).

## Relacionado

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Runtime do agente](/pt-BR/concepts/agent)
