---
read_when:
    - Iniciando uma nova sessão de agente do OpenClaw
    - Habilitando ou auditando Skills padrão
summary: Instruções padrão do agente OpenClaw e lista de Skills para a configuração do assistente pessoal
title: AGENTS.md padrão
x-i18n:
    generated_at: "2026-04-30T10:06:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - Assistente pessoal do OpenClaw (padrão)

## Primeira execução (recomendado)

O OpenClaw usa um diretório de workspace dedicado para o agente. Padrão: `~/.openclaw/workspace` (configurável via `agents.defaults.workspace`).

1. Crie o workspace (se ele ainda não existir):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copie os modelos padrão de workspace para o workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: se quiser a lista de Skills do assistente pessoal, substitua AGENTS.md por este arquivo:

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

- Não despeje diretórios nem segredos no chat.
- Não execute comandos destrutivos, a menos que isso seja solicitado explicitamente.
- Não envie respostas parciais/em streaming para superfícies de mensagens externas (apenas respostas finais).

## Início da sessão (obrigatório)

- Leia `SOUL.md`, `USER.md` e hoje+ontem em `memory/`.
- Leia `MEMORY.md` quando presente.
- Faça isso antes de responder.

## Alma (obrigatório)

- `SOUL.md` define identidade, tom e limites. Mantenha-o atualizado.
- Se você alterar `SOUL.md`, avise o usuário.
- Você é uma nova instância a cada sessão; a continuidade vive nesses arquivos.

## Espaços compartilhados (recomendado)

- Você não é a voz do usuário; tenha cuidado em chats de grupo ou canais públicos.
- Não compartilhe dados privados, informações de contato nem notas internas.

## Sistema de memória (recomendado)

- Registro diário: `memory/YYYY-MM-DD.md` (crie `memory/` se necessário).
- Memória de longo prazo: `MEMORY.md` para fatos, preferências e decisões duráveis.
- `memory.md` em minúsculas é apenas entrada de reparo legada; não mantenha ambos os arquivos na raiz de propósito.
- No início da sessão, leia hoje + ontem + `MEMORY.md` quando presente.
- Capture: decisões, preferências, restrições, ciclos em aberto.
- Evite segredos, a menos que sejam solicitados explicitamente.

## Ferramentas e Skills

- Ferramentas vivem em Skills; siga o `SKILL.md` de cada Skill quando precisar dela.
- Mantenha notas específicas do ambiente em `TOOLS.md` (Notas para Skills).

## Dica de backup (recomendado)

Se você tratar este workspace como a “memória” do Clawd, transforme-o em um repositório git (idealmente privado) para que `AGENTS.md` e seus arquivos de memória tenham backup.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## O que o OpenClaw faz

- Executa o Gateway do WhatsApp + agente de codificação Pi para que o assistente possa ler/escrever chats, buscar contexto e executar Skills via Mac host.
- O app macOS gerencia permissões (gravação de tela, notificações, microfone) e expõe a CLI `openclaw` via seu binário empacotado.
- Chats diretos são agrupados na sessão `main` do agente por padrão; grupos permanecem isolados como `agent:<agentId>:<channel>:group:<id>` (salas/canais: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats mantêm tarefas em segundo plano ativas.

## Skills principais (habilite em Configurações → Skills)

- **mcporter** — Runtime/CLI de servidor de ferramentas para gerenciar backends externos de Skills.
- **Peekaboo** — Capturas de tela rápidas do macOS com análise opcional por visão de IA.
- **camsnap** — Capture frames, clipes ou alertas de movimento de câmeras de segurança RTSP/ONVIF.
- **oracle** — CLI de agente pronta para OpenAI com reprodução de sessão e controle do navegador.
- **eightctl** — Controle seu sono pelo terminal.
- **imsg** — Envie, leia e faça streaming de iMessage e SMS.
- **wacli** — CLI do WhatsApp: sincronize, pesquise, envie.
- **discord** — Ações do Discord: reações, adesivos, enquetes. Use destinos `user:<id>` ou `channel:<id>` (ids numéricos sem prefixo são ambíguos).
- **gog** — CLI do Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Cliente Spotify de terminal para pesquisar/enfileirar/controlar reprodução.
- **sag** — Fala da ElevenLabs com UX de fala ao estilo do macOS; transmite para os alto-falantes por padrão.
- **Sonos CLI** — Controle caixas Sonos (descoberta/status/reprodução/volume/agrupamento) a partir de scripts.
- **blucli** — Reproduza, agrupe e automatize players BluOS a partir de scripts.
- **OpenHue CLI** — Controle de iluminação Philips Hue para cenas e automações.
- **OpenAI Whisper** — Conversão local de fala em texto para ditado rápido e transcrições de correio de voz.
- **Gemini CLI** — Modelos Google Gemini pelo terminal para perguntas e respostas rápidas.
- **agent-tools** — Kit de utilitários para automações e scripts auxiliares.

## Notas de uso

- Prefira a CLI `openclaw` para scripts; o app Mac cuida das permissões.
- Execute instalações pela aba Skills; ela oculta o botão se um binário já estiver presente.
- Mantenha Heartbeats habilitados para que o assistente possa agendar lembretes, monitorar caixas de entrada e acionar capturas de câmera.
- A UI Canvas roda em tela cheia com sobreposições nativas. Evite colocar controles críticos nas bordas superior esquerda/superior direita/inferiores; adicione gutters explícitos no layout e não dependa de safe-area insets.
- Para verificação orientada por navegador, use `openclaw browser` (abas/status/captura de tela) com o perfil do Chrome gerenciado pelo OpenClaw.
- Para inspeção do DOM, use `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando precisar de saída de máquina).
- Para interações, use `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type exigem refs de snapshot; use `evaluate` para seletores CSS).

## Relacionado

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Runtime do agente](/pt-BR/concepts/agent)
