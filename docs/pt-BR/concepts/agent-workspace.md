---
read_when:
    - Você precisa explicar o espaço de trabalho do agente ou sua estrutura de arquivos
    - Você quer fazer backup ou migrar um espaço de trabalho de agente
sidebarTitle: Agent workspace
summary: 'Espaço de trabalho do agente: localização, layout e estratégia de backup'
title: Espaço de trabalho do agente
x-i18n:
    generated_at: "2026-05-10T19:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

O workspace é a casa do agente. Ele é o único diretório de trabalho usado para ferramentas de arquivo e para o contexto do workspace. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena configuração, credenciais e sessões.

<Warning>
O workspace é o **cwd padrão**, não um sandbox rígido. As ferramentas resolvem caminhos relativos em relação ao workspace, mas caminhos absolutos ainda podem acessar outros locais no host, a menos que o sandboxing esteja ativado. Se você precisar de isolamento, use [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou configuração de sandbox por agente).

Quando o sandboxing está ativado e `workspaceAccess` não é `"rw"`, as ferramentas operam dentro de um workspace de sandbox em `~/.openclaw/sandboxes`, não no seu workspace do host.
</Warning>

## Local padrão

- Padrão: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` estiver definido e não for `"default"`, o padrão passa a ser `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criarão o workspace e semearão os arquivos de bootstrap se eles estiverem ausentes.

<Note>
As cópias de seed do sandbox aceitam apenas arquivos regulares dentro do workspace; aliases de symlink/hardlink que resolvem para fora do workspace de origem são ignorados.
</Note>

Se você já gerencia os arquivos do workspace por conta própria, pode desativar a criação de arquivos de bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Pastas extras de workspace

Instalações mais antigas podem ter criado `~/openclaw`. Manter vários diretórios de workspace pode causar confusão de autenticação ou desvio de estado, porque apenas um workspace fica ativo por vez.

<Note>
**Recomendação:** mantenha um único workspace ativo. Se você não usa mais as pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo, `trash ~/openclaw`). Se você mantém vários workspaces intencionalmente, certifique-se de que `agents.defaults.workspace` aponte para o ativo.

`openclaw doctor` avisa quando detecta diretórios extras de workspace.
</Note>

## Mapa de arquivos do workspace

Estes são os arquivos padrão que o OpenClaw espera dentro do workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md - instruções operacionais">
    Instruções operacionais para o agente e como ele deve usar a memória. Carregadas no início de cada sessão. Bom lugar para regras, prioridades e detalhes de "como se comportar".
  </Accordion>
  <Accordion title="SOUL.md - persona e tom">
    Persona, tom e limites. Carregado em todas as sessões. Guia: [guia de personalidade SOUL.md](/pt-BR/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - quem é o usuário">
    Quem é o usuário e como se dirigir a ele. Carregado em todas as sessões.
  </Accordion>
  <Accordion title="IDENTITY.md - nome, vibe, emoji">
    O nome, a vibe e o emoji do agente. Criado/atualizado durante o ritual de bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md - convenções de ferramentas locais">
    Observações sobre suas ferramentas locais e convenções. Não controla a disponibilidade de ferramentas; é apenas orientação.
  </Accordion>
  <Accordion title="HEARTBEAT.md - checklist de Heartbeat">
    Pequeno checklist opcional para execuções de Heartbeat. Mantenha-o curto para evitar gasto de tokens.
  </Accordion>
  <Accordion title="BOOT.md - checklist de inicialização">
    Checklist opcional de inicialização executado automaticamente no reinício do Gateway (quando [hooks internos](/pt-BR/automation/hooks) estão ativados). Mantenha-o curto; use a ferramenta de mensagens para envios de saída.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual de primeira execução">
    Ritual único de primeira execução. Criado apenas para um workspace totalmente novo. Exclua-o depois que o ritual for concluído.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro diário de memória">
    Registro diário de memória (um arquivo por dia). Recomendado ler hoje + ontem no início da sessão.
  </Accordion>
  <Accordion title="MEMORY.md - memória de longo prazo curada (opcional)">
    Memória de longo prazo curada: fatos duráveis, preferências, decisões e resumos curtos. Mantenha registros detalhados em `memory/YYYY-MM-DD.md` para que as ferramentas de memória possam recuperá-los sob demanda sem injetá-los em cada prompt. Carregue `MEMORY.md` apenas na sessão principal e privada (não em contextos compartilhados/de grupo). Consulte [Memória](/pt-BR/concepts/memory) para o fluxo de trabalho e a descarga automática de memória.
  </Accordion>
  <Accordion title="skills/ - skills do workspace (opcional)">
    Skills específicas do workspace. Local de Skill com maior precedência para esse workspace. Substitui skills de agente do projeto, skills de agente pessoais, skills gerenciadas, skills incluídas e `skills.load.extraDirs` quando há colisão de nomes.
  </Accordion>
  <Accordion title="canvas/ - arquivos de UI do Canvas (opcional)">
    Arquivos de UI do Canvas para exibições de nós (por exemplo, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Se algum arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de "arquivo ausente" na sessão e continua. Arquivos grandes de bootstrap são truncados quando injetados; ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 12000) e `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). `openclaw setup` pode recriar padrões ausentes sem sobrescrever arquivos existentes.
</Note>

## O que NÃO fica no workspace

Estes ficam em `~/.openclaw/` e NÃO devem ser commitados no repositório do workspace:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação do modelo: OAuth + chaves de API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (conta de runtime Codex por agente, configuração, skills, plugins e estado nativo de threads)
- `~/.openclaw/credentials/` (estado de canal/provedor mais dados legados de importação OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (skills gerenciadas)

Se você precisar migrar sessões ou configuração, copie-as separadamente e mantenha-as fora do controle de versão.

## Backup em Git (recomendado, privado)

Trate o workspace como memória privada. Coloque-o em um repositório git **privado** para que ele tenha backup e possa ser recuperado.

Execute estas etapas na máquina onde o Gateway roda (é onde o workspace fica).

<Steps>
  <Step title="Inicialize o repositório">
    Se o git estiver instalado, workspaces totalmente novos serão inicializados automaticamente. Se este workspace ainda não for um repositório, execute:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Adicione um remote privado">
    <Tabs>
      <Tab title="UI web do GitHub">
        1. Crie um novo repositório **privado** no GitHub.
        2. Não inicialize com um README (evita conflitos de merge).
        3. Copie a URL remota HTTPS.
        4. Adicione o remote e faça push:

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
        4. Adicione o remote e faça push:

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
Mesmo em um repositório privado, evite armazenar segredos no workspace:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.openclaw/`.
- Dumps brutos de conversas ou anexos sensíveis.

Se você precisar armazenar referências sensíveis, use placeholders e mantenha o segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).
</Warning>

Modelo inicial sugerido de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo o workspace para uma nova máquina

<Steps>
  <Step title="Clone o repositório">
    Clone o repositório para o caminho desejado (padrão `~/.openclaw/workspace`).
  </Step>
  <Step title="Atualize a configuração">
    Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Semeie arquivos ausentes">
    Execute `openclaw setup --workspace <path>` para semear quaisquer arquivos ausentes.
  </Step>
  <Step title="Copie sessões (opcional)">
    Se você precisar das sessões, copie `~/.openclaw/agents/<agentId>/sessions/` da máquina antiga separadamente.
  </Step>
</Steps>

## Observações avançadas

- O roteamento multiagente pode usar workspaces diferentes por agente. Consulte [Roteamento de canais](/pt-BR/channels/channel-routing) para a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver ativado, sessões não principais podem usar workspaces de sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionados

- [Heartbeat](/pt-BR/gateway/heartbeat) - arquivo de workspace HEARTBEAT.md
- [Sandboxing](/pt-BR/gateway/sandboxing) - acesso ao workspace em ambientes com sandbox
- [Sessão](/pt-BR/concepts/session) - caminhos de armazenamento de sessão
- [Ordens permanentes](/pt-BR/automation/standing-orders) - instruções persistentes em arquivos do workspace
