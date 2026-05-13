---
read_when:
    - Trabalhando em controles de telemetria / privacidade
    - Perguntas sobre quais dados são coletados
summary: Telemetria de instalação coletada via `clawhub sync` + opção de desativação.
x-i18n:
    generated_at: "2026-05-13T04:18:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

O ClawHub usa **telemetria mínima** para calcular **contagens de instalação** (o que está realmente em uso) e oferecer melhor ordenação/filtragem.
Isso se baseia no comando `clawhub sync` da CLI.

## Quando a telemetria é coletada

A telemetria só é enviada quando:

- Você está **logado** na CLI (já exigimos autenticação para fluxos de sincronização/publicação).
- Você executa `clawhub sync`.
- A telemetria **não está desativada** (veja “Como desativar” abaixo).

Se você não estiver logado, nada será reportado.

## O que coletamos

Em cada `clawhub sync`, a CLI reporta um **snapshot completo** do que encontrou, agrupado por raiz de varredura (“pasta/raiz”).

Para cada raiz, armazenamos:

- `rootId`: um **hash SHA-256** do caminho raiz canônico (o servidor nunca vê o caminho bruto).
- `label`: um rótulo legível por humanos derivado dos dois últimos segmentos do caminho (caminhos da pasta inicial são exibidos com `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opcional.

Para cada Skill encontrada em uma raiz, armazenamos:

- `skillId` (resolvido por slug; somente Skills que existem no registro são rastreadas).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (melhor esforço; atualmente a versão correspondente no registro, se conhecida).
- `removedAt` opcional quando uma instalação reportada anteriormente desaparece de uma raiz.

### O que _não_ coletamos

- Nenhum caminho absoluto bruto de pasta (somente `rootId` com hash + um rótulo curto de exibição).
- Nenhum conteúdo de arquivo.
- Nenhum log por execução, prompt ou outra saída da CLI.
- Nenhum rastreamento de Skills que não foram enviadas para o registro (slugs desconhecidos são ignorados).

## Contagens de instalação

Mantemos dois contadores por Skill:

- `installsCurrent`: usuários únicos que atualmente têm a Skill instalada em pelo menos uma raiz ativa.
- `installsAllTime`: usuários únicos que já reportaram a Skill como instalada.

### Múltiplas raízes

Se você sincronizar a partir de várias pastas, tratamos cada raiz de varredura de forma independente. Uma Skill está “atualmente instalada” se existir em **qualquer** raiz ativa.

### Detecção de desinstalação

Como `sync` reporta o conjunto completo por raiz:

- Se uma Skill desaparecer de uma raiz na próxima sincronização, marcamos que ela foi removida dessa raiz.
- Se a Skill for removida de todas as suas raízes, ela não conta mais para `installsCurrent`.
- `installsAllTime` nunca diminui, a menos que você exclua a telemetria (veja abaixo).

### Obsolescência (120 dias)

Raízes que não reportam telemetria por **120 dias** são marcadas como obsoletas, e suas instalações deixam de contar para `installsCurrent`.
Isso é avaliado de forma preguiçosa (no próximo relatório de telemetria) para evitar tarefas em segundo plano.

## Transparência + controles do usuário

O ClawHub fornece uma aba privada “Instalado” no seu próprio perfil:

- Mostra as raízes exatas + Skills instaladas que armazenamos.
- Inclui uma visualização de **exportação JSON**.
- Inclui uma ação **Excluir telemetria** para remover toda a telemetria armazenada da sua conta.

Todos os demais veem apenas **contadores agregados de instalação**; ninguém mais pode ver suas raízes/pastas.

Excluir sua conta também exclui seus dados de telemetria.

## Como desativar a telemetria

Defina a variável de ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Com isso definido, a CLI não enviará telemetria durante `clawhub sync`.
