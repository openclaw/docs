---
read_when:
    - Você precisa explicar o espaço de trabalho do agente ou sua estrutura de arquivos
    - Você quer fazer backup ou migrar o espaço de trabalho de um agente
sidebarTitle: Agent workspace
summary: 'Espaço de trabalho do agente: localização, estrutura e estratégia de cópia de segurança'
title: Espaço de trabalho do agente
x-i18n:
    generated_at: "2026-04-30T20:05:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

A workspace é a casa do agente. Ela é o único diretório de trabalho usado para ferramentas de arquivo e para o contexto da workspace. Mantenha-a privada e trate-a como memória.

Isso é separado de `~/.openclaw/`, que armazena configuração, credenciais e sessões.

<Warning>
A workspace é o **cwd padrão**, não uma sandbox rígida. As ferramentas resolvem caminhos relativos em relação à workspace, mas caminhos absolutos ainda podem alcançar outros locais no host, a menos que o sandboxing esteja habilitado. Se você precisa de isolamento, use [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou configuração de sandbox por agente).

Quando o sandboxing está habilitado e `workspaceAccess` não é `"rw"`, as ferramentas operam dentro de uma workspace de sandbox em `~/.openclaw/sandboxes`, não na sua workspace do host.
</Warning>

## Local padrão

- Padrão: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` estiver definido e não for `"default"`, o padrão se torna `~/.openclaw/workspace-<profile>`.
- Sobrescreva em `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criarão a workspace e popularão os arquivos de bootstrap se eles estiverem ausentes.

<Note>
Cópias de seed de sandbox aceitam apenas arquivos regulares dentro da workspace; aliases de symlink/hardlink que resolvem para fora da workspace de origem são ignorados.
</Note>

Se você já gerencia os arquivos da workspace por conta própria, pode desabilitar a criação de arquivos de bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Pastas extras de workspace

Instalações mais antigas podem ter criado `~/openclaw`. Manter vários diretórios de workspace pode causar confusão de autenticação ou divergência de estado, porque apenas uma workspace fica ativa por vez.

<Note>
**Recomendação:** mantenha uma única workspace ativa. Se você não usa mais as pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo, `trash ~/openclaw`). Se você mantiver intencionalmente várias workspaces, certifique-se de que `agents.defaults.workspace` aponte para a ativa.

`openclaw doctor` avisa quando detecta diretórios extras de workspace.
</Note>

## Mapa de arquivos da workspace

Estes são os arquivos padrão que o OpenClaw espera dentro da workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md — instruções operacionais">
    Instruções operacionais para o agente e como ele deve usar memória. Carregadas no início de cada sessão. Bom lugar para regras, prioridades e detalhes de "como se comportar".
  </Accordion>
  <Accordion title="SOUL.md — persona e tom">
    Persona, tom e limites. Carregado em toda sessão. Guia: [guia de personalidade SOUL.md](/pt-BR/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — quem é o usuário">
    Quem é o usuário e como se dirigir a ele. Carregado em toda sessão.
  </Accordion>
  <Accordion title="IDENTITY.md — nome, vibe, emoji">
    O nome, a vibe e o emoji do agente. Criado/atualizado durante o ritual de bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — convenções de ferramentas locais">
    Observações sobre suas ferramentas locais e convenções. Não controla a disponibilidade das ferramentas; é apenas orientação.
  </Accordion>
  <Accordion title="HEARTBEAT.md — checklist de Heartbeat">
    Pequeno checklist opcional para execuções de Heartbeat. Mantenha-o curto para evitar consumo de tokens.
  </Accordion>
  <Accordion title="BOOT.md — checklist de inicialização">
    Checklist opcional de inicialização executado automaticamente no reinício do Gateway (quando [hooks internos](/pt-BR/automation/hooks) estão habilitados). Mantenha-o curto; use a ferramenta de mensagem para envios de saída.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ritual da primeira execução">
    Ritual único da primeira execução. Criado apenas para uma workspace totalmente nova. Exclua-o depois que o ritual estiver concluído.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — log diário de memória">
    Log diário de memória (um arquivo por dia). Recomendado ler hoje + ontem no início da sessão.
  </Accordion>
  <Accordion title="MEMORY.md — memória de longo prazo curada (opcional)">
    Memória de longo prazo curada. Carregue apenas na sessão principal e privada (não em contextos compartilhados/de grupo). Consulte [Memória](/pt-BR/concepts/memory) para o fluxo de trabalho e o flush automático de memória.
  </Accordion>
  <Accordion title="skills/ — Skills da workspace (opcional)">
    Skills específicas da workspace. Local de Skills de maior precedência para essa workspace. Sobrescreve Skills de agente de projeto, Skills de agente pessoais, Skills gerenciadas, Skills empacotadas e `skills.load.extraDirs` quando nomes colidem.
  </Accordion>
  <Accordion title="canvas/ — arquivos da UI Canvas (opcional)">
    Arquivos da UI Canvas para exibições de nós (por exemplo, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se algum arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de "arquivo ausente" na sessão e continua. Arquivos de bootstrap grandes são truncados quando injetados; ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 12000) e `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). `openclaw setup` pode recriar padrões ausentes sem sobrescrever arquivos existentes.
</Note>

## O que NÃO fica na workspace

Estes ficam em `~/.openclaw/` e NÃO devem ser commitados no repositório da workspace:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelo: OAuth + chaves de API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (conta de runtime Codex por agente, configuração, Skills, plugins e estado nativo de threads)
- `~/.openclaw/credentials/` (estado de canal/provedor mais dados legados de importação OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (Skills gerenciadas)

Se você precisa migrar sessões ou configuração, copie-as separadamente e mantenha-as fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate a workspace como memória privada. Coloque-a em um repositório git **privado** para que ela tenha backup e seja recuperável.

Execute estes passos na máquina onde o Gateway roda (é onde a workspace vive).

<Steps>
  <Step title="Inicialize o repositório">
    Se o git estiver instalado, workspaces totalmente novas são inicializadas automaticamente. Se esta workspace ainda não for um repositório, execute:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Adicione um remoto privado">
    <Tabs>
      <Tab title="UI web do GitHub">
        1. Crie um novo repositório **privado** no GitHub.
        2. Não inicialize com um README (evita conflitos de merge).
        3. Copie a URL remota HTTPS.
        4. Adicione o remoto e faça push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="UI web do GitLab">
        1. Crie um novo repositório **privado** no GitLab.
        2. Não inicialize com um README (evita conflitos de merge).
        3. Copie a URL remota HTTPS.
        4. Adicione o remoto e faça push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Atualizações contínuas">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Não commite segredos

<Warning>
Mesmo em um repositório privado, evite armazenar segredos na workspace:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.openclaw/`.
- Dumps brutos de conversas ou anexos sensíveis.

Se você precisar armazenar referências sensíveis, use placeholders e mantenha o segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).
</Warning>

Sugestão inicial de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo a workspace para uma nova máquina

<Steps>
  <Step title="Clone o repositório">
    Clone o repositório para o caminho desejado (padrão `~/.openclaw/workspace`).
  </Step>
  <Step title="Atualize a configuração">
    Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Popule arquivos ausentes">
    Execute `openclaw setup --workspace <path>` para popular qualquer arquivo ausente.
  </Step>
  <Step title="Copie sessões (opcional)">
    Se precisar de sessões, copie `~/.openclaw/agents/<agentId>/sessions/` da máquina antiga separadamente.
  </Step>
</Steps>

## Observações avançadas

- O roteamento multiagente pode usar workspaces diferentes por agente. Consulte [Roteamento de canais](/pt-BR/channels/channel-routing) para a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver habilitado, sessões não principais podem usar workspaces de sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionados

- [Heartbeat](/pt-BR/gateway/heartbeat) — arquivo de workspace HEARTBEAT.md
- [Sandboxing](/pt-BR/gateway/sandboxing) — acesso à workspace em ambientes com sandbox
- [Sessão](/pt-BR/concepts/session) — caminhos de armazenamento de sessões
- [Ordens permanentes](/pt-BR/automation/standing-orders) — instruções persistentes em arquivos da workspace
