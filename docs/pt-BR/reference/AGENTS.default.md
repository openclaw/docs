---
read_when:
    - Iniciando uma nova sessão de agente do OpenClaw
    - Habilitando ou auditando Skills padrão
summary: Instruções padrão do agente OpenClaw e lista de Skills para a configuração do assistente pessoal
title: AGENTS.md padrão
x-i18n:
    generated_at: "2026-05-06T09:12:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ecfafd0bee8b18f5787a0b8e273ce281c40c7d2d5754f15daa1f2b7cc7ecad0
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Primeira execução (recomendada)

OpenClaw usa um diretório de workspace dedicado para o agente. Padrão: `~/.openclaw/workspace` (configurável via `agents.defaults.workspace`).

1. Crie o workspace (se ele ainda não existir):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copie os templates padrão do workspace para o workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Opcional: se você quiser a lista de Skills do assistente pessoal, substitua AGENTS.md por este arquivo:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Opcional: escolha um workspace diferente definindo `agents.defaults.workspace` (compatível com `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Padrões de segurança

- Não despeje diretórios ou segredos no chat.
- Não execute comandos destrutivos, a menos que isso seja pedido explicitamente.
- Não envie respostas parciais/em streaming para superfícies de mensagens externas (apenas respostas finais).

## Início da sessão (obrigatório)

- Leia `SOUL.md`, `USER.md` e hoje+ontem em `memory/`.
- Leia `MEMORY.md` quando presente.
- Faça isso antes de responder.

## Alma (obrigatório)

- `SOUL.md` define identidade, tom e limites. Mantenha-o atualizado.
- Se você alterar `SOUL.md`, avise o usuário.
- Você é uma nova instância a cada sessão; a continuidade vive nestes arquivos.

## Espaços compartilhados (recomendado)

- Você não é a voz do usuário; tenha cuidado em chats em grupo ou canais públicos.
- Não compartilhe dados privados, informações de contato ou notas internas.

## Sistema de memória (recomendado)

- Registro diário: `memory/YYYY-MM-DD.md` (crie `memory/` se necessário).
- Memória de longo prazo: `MEMORY.md` para fatos, preferências e decisões duráveis.
- `memory.md` em minúsculas é apenas entrada de reparo legado; não mantenha ambos os arquivos raiz de propósito.
- No início da sessão, leia hoje + ontem + `MEMORY.md` quando presente.
- Capture: decisões, preferências, restrições, pendências.
- Evite segredos, a menos que solicitado explicitamente.

## Ferramentas e Skills

- Ferramentas ficam em Skills; siga o `SKILL.md` de cada Skill quando precisar dela.
- Mantenha notas específicas do ambiente em `TOOLS.md` (Notas para Skills).

## Dica de backup (recomendada)

Se você tratar este workspace como a "memória" do Clawd, transforme-o em um repositório git (idealmente privado) para que `AGENTS.md` e seus arquivos de memória tenham backup.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## O que o OpenClaw faz

- Executa o Gateway do WhatsApp + o agente de programação Pi para que o assistente possa ler/escrever chats, buscar contexto e executar Skills via Mac host.
- O app macOS gerencia permissões (gravação de tela, notificações, microfone) e expõe a CLI `openclaw` por meio do binário incluído.
- Chats diretos são consolidados na sessão `main` do agente por padrão; grupos permanecem isolados como `agent:<agentId>:<channel>:group:<id>` (salas/canais: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats mantêm tarefas em segundo plano ativas.

## Skills principais (ative em Configurações → Skills)

- **mcporter** - Runtime/CLI de servidor de ferramentas para gerenciar backends externos de Skills.
- **Peekaboo** - Capturas de tela rápidas no macOS com análise opcional de visão por IA.
- **camsnap** - Capture quadros, clipes ou alertas de movimento de câmeras de segurança RTSP/ONVIF.
- **oracle** - CLI de agente pronta para OpenAI com reprodução de sessão e controle de navegador.
- **eightctl** - Controle seu sono pelo terminal.
- **imsg** - Envie, leia e transmita iMessage e SMS.
- **wacli** - CLI do WhatsApp: sincronizar, pesquisar, enviar.
- **discord** - Ações do Discord: reações, adesivos, enquetes. Use destinos `user:<id>` ou `channel:<id>` (ids numéricos sem prefixo são ambíguos).
- **gog** - CLI do Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Cliente Spotify de terminal para pesquisar/colocar na fila/controlar a reprodução.
- **sag** - Fala da ElevenLabs com UX de say no estilo Mac; transmite para alto-falantes por padrão.
- **Sonos CLI** - Controle alto-falantes Sonos (descoberta/status/reprodução/volume/agrupamento) a partir de scripts.
- **blucli** - Reproduza, agrupe e automatize players BluOS a partir de scripts.
- **OpenHue CLI** - Controle de iluminação Philips Hue para cenas e automações.
- **OpenAI Whisper** - Conversão local de fala em texto para ditado rápido e transcrições de correio de voz.
- **Gemini CLI** - Modelos Google Gemini pelo terminal para perguntas e respostas rápidas.
- **agent-tools** - Kit de utilitários para automações e scripts auxiliares.

## Notas de uso

- Prefira a CLI `openclaw` para scripts; o app Mac cuida das permissões.
- Execute instalações pela aba Skills; ela oculta o botão se um binário já estiver presente.
- Mantenha Heartbeats ativados para que o assistente possa agendar lembretes, monitorar caixas de entrada e acionar capturas de câmera.
- A UI do Canvas roda em tela cheia com sobreposições nativas. Evite posicionar controles críticos nas bordas superior esquerda/superior direita/inferiores; adicione margens explícitas no layout e não dependa de safe-area insets.
- Para verificação orientada por navegador, use `openclaw browser` (abas/status/captura de tela) com o perfil do Chrome gerenciado pelo OpenClaw.
- Para inspeção do DOM, use `openclaw browser eval|query|dom|snapshot` (e `--json`/`--out` quando precisar de saída legível por máquina).
- Para interações, use `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type exigem refs de snapshot; use `evaluate` para seletores CSS).

## Relacionados

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Runtime do agente](/pt-BR/concepts/agent)
