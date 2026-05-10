---
read_when:
    - Trabalhando nos controles de telemetria / privacidade
    - Perguntas sobre quais dados são coletados
summary: Telemetria de instalação coletada via `clawhub sync` + opção de desativação.
x-i18n:
    generated_at: "2026-05-10T19:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

O ClawHub usa **telemetria mínima** para calcular **contagens de instalações** (o que está realmente em uso) e para oferecer melhor ordenação/filtragem.
Isso se baseia no comando da CLI `clawhub sync`.

## Quando a telemetria é coletada

A telemetria só é enviada quando:

- Você está **conectado** na CLI (já exigimos autenticação para fluxos de sincronização/publicação).
- Você executa `clawhub sync`.
- A telemetria **não está desativada** (veja “Como desativar” abaixo).

Se você não estiver conectado, nada será relatado.

## O que coletamos

Em cada `clawhub sync`, a CLI relata um **snapshot completo** do que encontrou, agrupado por raiz de varredura (“pasta/raiz”).

Para cada raiz, armazenamos:

- `rootId`: um **hash SHA-256** do caminho canônico da raiz (o servidor nunca vê o caminho bruto).
- `label`: um rótulo legível por humanos derivado dos dois últimos segmentos do caminho (caminhos da pasta pessoal são mostrados com `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opcional.

Para cada skill encontrada sob uma raiz, armazenamos:

- `skillId` (resolvido por slug; apenas Skills que existem no registro são rastreadas).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (melhor esforço; atualmente a versão correspondente no registro, se conhecida).
- `removedAt` opcional quando uma instalação relatada anteriormente desaparece de uma raiz.

### O que _não_ coletamos

- Nenhum caminho absoluto bruto de pasta (apenas `rootId` com hash + um rótulo curto de exibição).
- Nenhum conteúdo de arquivo.
- Nenhum log por execução, prompt ou outra saída da CLI.
- Nenhum rastreamento para Skills que não foram enviadas ao registro (slugs desconhecidos são ignorados).

## Contagens de instalações

Mantemos dois contadores por skill:

- `installsCurrent`: usuários únicos que atualmente têm a skill instalada em pelo menos uma raiz ativa.
- `installsAllTime`: usuários únicos que já relataram a skill como instalada.

### Múltiplas raízes

Se você sincronizar a partir de várias pastas, tratamos cada raiz de varredura de forma independente. Uma skill é considerada “instalada atualmente” se existir em **qualquer** raiz ativa.

### Detecção de desinstalação

Como `sync` relata o conjunto completo por raiz:

- Se uma skill desaparecer de uma raiz na próxima sincronização, nós a marcamos como removida para essa raiz.
- Se a skill for removida de todas as suas raízes, ela não contará mais para `installsCurrent`.
- `installsAllTime` nunca diminui, a menos que você exclua a telemetria (veja abaixo).

### Obsolescência (120 dias)

Raízes que não relatarem telemetria por **120 dias** são marcadas como obsoletas, e suas instalações deixam de contar para `installsCurrent`.
Isso é avaliado de forma preguiçosa (no próximo relatório de telemetria) para evitar jobs em segundo plano.

## Transparência + controles do usuário

O ClawHub fornece uma aba privada “Instaladas” no seu próprio perfil:

- Mostra exatamente as raízes + Skills instaladas que armazenamos.
- Inclui uma visualização de **exportação JSON**.
- Inclui uma ação **Excluir telemetria** para remover toda a telemetria armazenada da sua conta.

Todos os demais veem apenas **contadores agregados de instalações**; ninguém mais pode ver suas raízes/pastas.

Excluir sua conta também exclui seus dados de telemetria.

## Como desativar a telemetria

Defina a variável de ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Com isso definido, a CLI não enviará telemetria durante `clawhub sync`.
