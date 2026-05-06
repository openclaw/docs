---
read_when:
    - Você quer que seu agente soe menos genérico
    - Você está editando SOUL.md
    - Você quer uma personalidade mais marcante sem comprometer a segurança nem a concisão
summary: Use SOUL.md para dar ao seu agente OpenClaw uma voz própria em vez de texto genérico de assistente.
title: Guia de personalidade do SOUL.md
x-i18n:
    generated_at: "2026-05-06T05:52:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` é onde vive a voz do seu agente.

OpenClaw o injeta em sessões normais, então ele tem peso real. Se o seu agente
soa sem graça, evasivo ou estranhamente corporativo, geralmente é esse o arquivo a corrigir.

## O que pertence ao SOUL.md

Coloque o que muda a sensação de conversar com o agente:

- tom
- opiniões
- concisão
- humor
- limites
- nível padrão de franqueza

**Não** transforme isso em:

- uma história de vida
- um changelog
- um despejo de política de segurança
- uma muralha gigante de vibes sem efeito comportamental

Curto vence longo. Preciso vence vago.

## Por que isso funciona

Isso se alinha à orientação de prompts da OpenAI:

- O guia de engenharia de prompt diz que comportamento de alto nível, tom, objetivos e
  exemplos pertencem à camada de instruções de alta prioridade, não enterrados na
  interação do usuário.
- O mesmo guia recomenda tratar prompts como algo que você itera,
  fixa e avalia, não como uma prosa mágica que você escreve uma vez e esquece.

Para OpenClaw, `SOUL.md` é essa camada.

Se você quer uma personalidade melhor, escreva instruções mais fortes. Se você quer uma personalidade estável,
mantenha-as concisas e versionadas.

Referências da OpenAI:

- [Engenharia de prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Funções de mensagem e seguimento de instruções](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## O prompt do Molty

Cole isto no seu agente e deixe-o reescrever `SOUL.md`.

Caminho fixo para workspaces do OpenClaw: use `SOUL.md`, não `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Como é um bom exemplo

Boas regras de `SOUL.md` soam assim:

- tenha uma posição
- pule o enchimento
- seja engraçado quando fizer sentido
- aponte ideias ruins cedo
- mantenha-se conciso, a menos que profundidade seja realmente útil

Regras ruins de `SOUL.md` soam assim:

- mantenha o profissionalismo em todos os momentos
- forneça assistência abrangente e cuidadosa
- garanta uma experiência positiva e acolhedora

Essa segunda lista é como você obtém algo pastoso.

## Um aviso

Personalidade não é permissão para ser descuidado.

Mantenha `AGENTS.md` para regras operacionais. Mantenha `SOUL.md` para voz, postura e
estilo. Se o seu agente trabalha em canais compartilhados, respostas públicas ou superfícies de cliente,
garanta que o tom ainda combine com o ambiente.

Ser afiado é bom. Ser irritante não é.

## Relacionado

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/pt-BR/concepts/agent-workspace" icon="folder-open">
    Arquivos de workspace que o OpenClaw injeta no prompt do sistema.
  </Card>
  <Card title="System prompt" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    Como `SOUL.md` é composto no prompt do sistema por interação.
  </Card>
  <Card title="SOUL.md template" href="/pt-BR/reference/templates/SOUL" icon="file-lines">
    Modelo inicial para um arquivo de personalidade.
  </Card>
</CardGroup>
