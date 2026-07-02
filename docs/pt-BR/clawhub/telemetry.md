---
read_when:
    - Trabalhando em controles de telemetria / privacidade
    - Perguntas sobre quais dados são coletados
summary: Telemetria de instalação coletada pela CLI do ClawHub e como desativá-la.
x-i18n:
    generated_at: "2026-07-02T00:47:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub usa telemetria mínima da CLI para calcular contagens agregadas de instalações.

## Quando a telemetria é coletada

A telemetria só é enviada quando:

- Você está conectado na CLI.
- Você executa `clawhub install <slug>`.
- A telemetria **não está desabilitada** (veja “Como desabilitar” abaixo).

Se você não estiver conectado, nada será reportado.

## O que coletamos

Em cada `clawhub install` reportado, a CLI envia um evento de instalação de melhor esforço.

O evento inclui:

- `slug`: o slug da skill instalada.
- `version`: a versão instalada, quando conhecida.

### O que _não_ coletamos

- Nenhum caminho de pasta ou identificador derivado de pasta.
- Nenhum conteúdo de arquivo.
- Nenhum log por execução, prompt ou outra saída da CLI.

## Contagens de instalações

ClawHub mantém contadores agregados por skill:

- `installsAllTime`: usuários únicos que reportaram pelo menos uma instalação pela CLI para a skill.
- `installsCurrent`: usuários únicos que reportaram uma instalação e não excluíram sua
  telemetria.

## Transparência + controles do usuário

Todos veem apenas **contadores agregados de instalações**.

Excluir sua conta também exclui seus dados de telemetria.

## Como desabilitar a telemetria

Defina a variável de ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Com isso definido, a CLI não enviará telemetria de instalação.
