---
read_when:
    - Você precisa explicar o workspace do agente ou seu layout de arquivos
    - Você quer fazer backup ou migrar um workspace do agente
summary: 'Workspace do agente: localização, layout e estratégia de backup'
title: Workspace do agente
x-i18n:
    generated_at: "2026-04-25T13:44:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

O workspace é a casa do agente. É o único diretório de trabalho usado para
ferramentas de arquivo e para contexto de workspace. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena configuração, credenciais e
sessões.

**Importante:** o workspace é o **cwd padrão**, não um sandbox rígido. As ferramentas
resolvem caminhos relativos em relação ao workspace, mas caminhos absolutos ainda podem alcançar
outras partes do host, a menos que o sandboxing esteja ativado. Se você precisar de isolamento, use
[`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou configuração de sandbox por agente).
Quando o sandboxing está ativado e `workspaceAccess` não é `"rw"`, as ferramentas operam
dentro de um workspace de sandbox em `~/.openclaw/sandboxes`, não no workspace do host.

## Local padrão

- Padrão: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` estiver definido e não for `"default"`, o padrão passa a ser
  `~/.openclaw/workspace-<profile>`.
- Substitua em `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criarão o
workspace e semearão os arquivos de bootstrap se eles estiverem ausentes.
Cópias de seed de sandbox aceitam apenas arquivos regulares dentro do workspace; aliases
de symlink/hardlink que sejam resolvidos fora do workspace de origem são ignorados.

Se você já gerencia os arquivos do workspace por conta própria, pode desativar a criação
de arquivos de bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Pastas extras de workspace

Instalações antigas podem ter criado `~/openclaw`. Manter vários diretórios de
workspace pode causar deriva confusa de autenticação ou estado, porque apenas um
workspace fica ativo por vez.

**Recomendação:** mantenha um único workspace ativo. Se você não usa mais as
pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo `trash ~/openclaw`).
Se você intencionalmente mantiver vários workspaces, certifique-se de que
`agents.defaults.workspace` aponte para o ativo.

`openclaw doctor` avisa quando detecta diretórios extras de workspace.

## Mapa de arquivos do workspace (o que cada arquivo significa)

Estes são os arquivos padrão que o OpenClaw espera dentro do workspace:

- `AGENTS.md`
  - Instruções operacionais para o agente e como ele deve usar memória.
  - Carregado no início de cada sessão.
  - Bom lugar para regras, prioridades e detalhes de “como se comportar”.

- `SOUL.md`
  - Persona, tom e limites.
  - Carregado em toda sessão.
  - Guia: [SOUL.md Personality Guide](/pt-BR/concepts/soul)

- `USER.md`
  - Quem é o usuário e como se dirigir a ele.
  - Carregado em toda sessão.

- `IDENTITY.md`
  - Nome, vibe e emoji do agente.
  - Criado/atualizado durante o ritual de bootstrap.

- `TOOLS.md`
  - Observações sobre suas ferramentas locais e convenções.
  - Não controla a disponibilidade de ferramentas; é apenas orientação.

- `HEARTBEAT.md`
  - Checklist pequeno opcional para execuções de Heartbeat.
  - Mantenha-o curto para evitar gasto de tokens.

- `BOOT.md`
  - Checklist opcional de inicialização executado automaticamente na reinicialização do Gateway (quando [internal hooks](/pt-BR/automation/hooks) estão ativados).
  - Mantenha-o curto; use a ferramenta de mensagem para envios de saída.

- `BOOTSTRAP.md`
  - Ritual único de primeira execução.
  - Criado apenas para um workspace totalmente novo.
  - Exclua-o após a conclusão do ritual.

- `memory/YYYY-MM-DD.md`
  - Log diário de memória (um arquivo por dia).
  - Recomendado ler o de hoje + o de ontem no início da sessão.

- `MEMORY.md` (opcional)
  - Memória de longo prazo curada.
  - Carregue apenas na sessão principal e privada (não em contextos compartilhados/de grupo).

Consulte [Memory](/pt-BR/concepts/memory) para o fluxo de trabalho e o flush automático de memória.

- `skills/` (opcional)
  - Skills específicas do workspace.
  - Local de Skills com maior precedência para esse workspace.
  - Substitui Skills de agente do projeto, Skills pessoais do agente, Skills gerenciadas, Skills empacotadas e `skills.load.extraDirs` quando há colisão de nomes.

- `canvas/` (opcional)
  - Arquivos de UI do Canvas para exibições de Node (por exemplo `canvas/index.html`).

Se algum arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de “arquivo ausente” na
sessão e continua. Arquivos grandes de bootstrap são truncados quando injetados;
ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 12000) e
`agents.defaults.bootstrapTotalMaxChars` (padrão: 60000).
`openclaw setup` pode recriar padrões ausentes sem sobrescrever
arquivos existentes.

## O que NÃO está no workspace

Estes ficam em `~/.openclaw/` e NÃO devem ser versionados no repositório do workspace:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelo: OAuth + chaves de API)
- `~/.openclaw/credentials/` (estado de canal/provedor mais dados legados de importação OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (Skills gerenciadas)

Se você precisar migrar sessões ou configuração, copie-as separadamente e mantenha-as
fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate o workspace como memória privada. Coloque-o em um repositório git **privado** para que fique
com backup e seja recuperável.

Execute estas etapas na máquina em que o Gateway roda (é lá que o
workspace fica).

### 1) Inicialize o repositório

Se o git estiver instalado, workspaces totalmente novos são inicializados automaticamente. Se este
workspace ainda não for um repositório, execute:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Adicione um remoto privado (opções amigáveis para iniciantes)

Opção A: interface web do GitHub

1. Crie um novo repositório **privado** no GitHub.
2. Não inicialize com README (evita conflitos de merge).
3. Copie a URL remota HTTPS.
4. Adicione o remoto e faça push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opção B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opção C: interface web do GitLab

1. Crie um novo repositório **privado** no GitLab.
2. Não inicialize com README (evita conflitos de merge).
3. Copie a URL remota HTTPS.
4. Adicione o remoto e faça push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Atualizações contínuas

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Não faça commit de segredos

Mesmo em um repositório privado, evite armazenar segredos no workspace:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.openclaw/`.
- Dumps brutos de chats ou anexos sensíveis.

Se você precisar armazenar referências sensíveis, use placeholders e mantenha o
segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).

Sugestão inicial de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo o workspace para uma nova máquina

1. Clone o repositório para o caminho desejado (padrão `~/.openclaw/workspace`).
2. Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
3. Execute `openclaw setup --workspace <path>` para semear os arquivos ausentes.
4. Se você precisar das sessões, copie `~/.openclaw/agents/<agentId>/sessions/` da
   máquina antiga separadamente.

## Observações avançadas

- O roteamento de vários agentes pode usar workspaces diferentes por agente. Consulte
  [Channel routing](/pt-BR/channels/channel-routing) para a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver ativado, sessões não principais podem usar
  workspaces de sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Standing Orders](/pt-BR/automation/standing-orders) — instruções persistentes em arquivos do workspace
- [Heartbeat](/pt-BR/gateway/heartbeat) — arquivo de workspace HEARTBEAT.md
- [Session](/pt-BR/concepts/session) — caminhos de armazenamento de sessão
- [Sandboxing](/pt-BR/gateway/sandboxing) — acesso ao workspace em ambientes com sandbox
