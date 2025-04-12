import { Note } from '../types/Note';

// Sample audio blob - this is just a placeholder as we can't actually create a Blob here
// In a real implementation, you would replace this with an actual audio file
const createDummyBlob = (): Blob => {
  return new Blob([], { type: 'audio/mp3' });
};

export const sampleNote: Note = {
  id: 'sample-note-1',
  title: 'Primera consulta - Dr. Quintero',
  date: '2025-12-03T10:30:00Z',
  doctorName: 'Dr. Fernando Quintero',
  specialty: 'Traumatología',
  location: 'Hospital Italiano, Buenos Aires',
  audioBlob: createDummyBlob(),
  transcription: `Come in. Miss Bellamy? Yes. Hi. I'm Honey Harris. I'll be your doctor today. Let me just wash my hands really quick. Would you prefer miss Bellamy, or would you can I call you Pat? Pat's fine. Great. Well, it's nice to meet you. Nice to meet you. Can you tell me why you're here today? I have a terrible headache. It looks really bad. Is there anything else besides your headache that you wanna address here today at the clinical program? No. It's just that except I am concerned. I just recently changed insurance companies, and I'm not sure this is gonna be covered yet. Alright. Was there anything because what we can do is while we're talking and I'm doing your history and physical, I will have my office secretary look into the insurance plan that you have. Alright. So you don't have to worry about that. Sounds good. Okay. Sounds great. Mhmm. Is there anything else? No. I just this is just really bad. Okay. So what I'd like to do today and is let's let's take a look at what's causing your headache. Alright. I will go over history, physical. Okay. And then we'll do, again, a physical exam, and then we will look into your insurance policy and make sure that's all Okay. You know, taken care of. That sound like a good plan for you? That's that's good. Perfect. So tell me a little bit more about this the head head pain that you're having. Well, it started about three days ago, and nothing has helped. It it's it's just laid me flat. I haven't been able to go to work. It's nothing's helped. I I it's it's all over. I it's really bad when I move, so I'm trying not to move too much. And Okay. The light is bothering me a lot. Okay. And, unfortunately, I can't dim the lights Okay. In this room. Right. But so It's okay. I'll try to go quickly, and would it be okay if I took some notes? Oh, sure. Yeah. So you said this started about three days ago? Mhmm. Okay. Was there any anything that brought it on? Anything unusual that happened maybe three days ago? Not really. No. Okay. Can you tell me anything that makes it better? Is there anything Nothing's made it better. I I took some Tylenol. I tried Motrin. Nothing. I just try not to move too much. Alright. Is there anything that makes it worse? Yeah. Like Movement. Movement. And light. Okay. And it's just constant, though. There's you know, it it doesn't it's just constant. It's it's all over. Okay. So if you had a rate on a pain scale, zero being no pain, 10 being the worst pain you ever had. Oh, it's a 10. A 10. I've never had a headache like this. Okay. Yeah. That sounds really bad. Now as far as radiation, does that move? Does it that you said the head the is all up or in the front of your head? It's kinda all over. Okay. But it also I've got this shooting pain down my neck, and my neck is is very stiff. Okay. But it's not it's it's it's the entire head. Entire head? Okay. Yeah. As far as in the in the timing, you said that it started three days ago, but is it you said it's a constant Yeah. Or it comes and goes? It started gradually, but once once it got there, it's it hasn't gone away. It doesn't get better. It doesn't get worse. It's just the same. Okay. So do you what I wanna get is your perception of what you think is going on. Oh, I don't know. I just I can hardly think. It's so painful. I I just because it's so bad, I was afraid my neighbor had a headache and ignored it last year, and he suddenly started having seizures. And it turns out he had a a brain tumor, so I thought I I just should come in and Yeah. I can understand your concern. What how is it impacting your daily life? I can't go to work. I don't know. I can't do anything. Yeah. Okay. So it sounds like it's really impacting your life. And I can't. K. That. If it's okay, I would like to go some talk about a little bit about your medical history and your social history. Alright. Can you tell me as far as your medical history, have do you have any medical conditions I should be aware of? Not was diagnosed with high blood pressure Okay. About three years ago, but we've been addressing it with diet changes. Okay. So it's controlled by doctor. Yeah. I go in yearly. I had been just and it's been well controlled. So Okay. Great. I haven't been on medication. No worries for that. But other than that, I haven't had any problems. Okay. Any surgical history? No. Mm-mm. Any hospitalizations? Mm-mm. No. Alright. And you said your the only medicine you're taking was Tylenol, Tylenol, Tylenol, They didn't help. Yep. Okay. Just wanted to verify. Uh-huh. Do you have any drug allergies? No. No. Okay. What about family history? Do you have any medical history of headaches? Or In my family? Right. You know, my mom said she used to get migraines when she was in her twenties and thirties. Okay. But I don't remember her saying anything else about it. My sister I have one sister. She's she's healthy. My dad, he has high blood pressure, but other than that, he's healthy, and that's about it. I don't I don't have any kids. Alright. It's alright. I'd I would like to ask you some social history questions that just for the records. Okay. Do you smoke? Yeah. I do. Okay. Is it cigarettes or chewing? Yes. Cigarettes. And how much do you smoke? About a half a pack a day. Okay. What about alcohol? I don't drink. Okay. Also, are you married? Yeah. I'm married. Okay. And children? No. Okay. And just some some just some additional questions is looking at your kinda GYN history. Are you last menstrual period? Oh, I'm in menopause. Okay. So going back into the history again, have you you said your mom had migraines Mhmm. Earlier on. Have you been around and no other you haven't been nauseous, or have you been Yeah. I've been I've been nauseous. Okay. In fact, I threw up twice early on. Okay. Because when I move, it makes me nauseous. Okay. Nothing out of the ordinary over the past couple weeks? Have you been on any trips or anything? Or Actually, a week ago, I was in North Carolina for a family reunion. Okay. And there was a four year old who was sick there. I I don't know what they had, but they I guess I guess they ended up taking him into emergency. Right. I don't know. So let me just summarize to make sure I've got everything straight so far is you started having an onset of a severe headache about three days ago. Mhmm. It's worse with movement. Yeah. Light really makes it hurt bad. Mhmm. It's a 10 out of 10 pain, and you're also complaining of a stiff neck with that. Yes. It came on gradually, and it's been constant pain in the frontal area. Mhmm. Medical history, you're in hyper. You have high blood pressure, but that's controlled with diet. Mhmm. No surgical history. No really hospitalizations. The pain, though, isn't really impacting your day to day living and daily life. You took tried Tylenol, Motrin, it didn't help. Otherwise, no medications. You've got the family history of your mom with migraines. Otherwise, your family is healthy. Yeah. You smoke about a half a pack a day. You don't drink. And then you were you you said you took a trip about a week ago Yeah. Or two weeks ago? Yeah. Okay. It was a family reunion a week ago. Okay. Yeah. I don't know. It was in North Carolina. Alright. Yeah. I can understand your concern you about your friend. You said that he was having seizures. Mhmm. I've just never had this kind of pain before. Yeah. And I can understand that. And, you know so what I would like to do is we've pretty much gone over your the history. Mhmm. What I'd like to do is complete a physical exam. Okay. Do some testing. Alright. And I wanna ask too if there's any other concerns I need to address before we get to that final exam. Okay. Yep. That sounds good. Okay. Sounds great. Okay. Alright. Hi. I'm Deb. Deb, I'm your degree. Standardized patient. Right. Nice job. Going to give you some feedback on your communication skills Alright. In this encounter. But before I do, how did you feel it went? I feel pretty good. I was I was nervous at first, I think, and just trying to make sure that I was getting all your patient information so we could, you know, make sure we got the correct tests and Yeah. Yeah. Know. Yeah. How did you feel when you when you walked in? You feel pretty comfortable? I think I got more comfortable as we sat down and got to talking. I could see that. Yeah. Good. Okay. Well, I thought you did a a nice job. You had an appropriate introduction, introduced yourself, first and last name, shook hands. I think you have a very warm demeanor, and you're comfortable, which makes me as a patient comfortable. You did ex elicit my chief complaint and asked about any other concerns, and that's when I told you I was also concerned about my insurance. So that was another thing on the agenda. So you did set a mutual agenda, asked me if I agreed. And so we had a clear road map going forward, so you did you hit all those real well. You your first question, tell me about this pain, or that was a nice open ended question, so it allowed me to then tell my story. Followed up with some more pointed questions just for clarification on and you had you're an active listener, had good contact, eye contact, and could do a little bit more reflective listening. Okay. Just a little points where you could verify, check for accuracy, maybe paraphrase as as I'm going through. You did a nice summary in the middle. That's good. But just a little bit more reflection on that to let me know as a patient that you're hearing me. You asked my perspective of what I thought was going on, and then you got the story of my fear that maybe I've got a brain tumor. Oh, no. Right. Yeah. So I thought you had nice flow, logical sequence of questioning. Little bit of signposting. We just covered this, and now we're going to do that. I I heard that once. And as these interviews get longer, you're going to wanna signpost between each section. I've taken your history. I'd like to go into Right. A a physical exam, that kind of thing. Did a nice summary in the middle. You moved through quickly, so you attended to the timeline. You did ask permission permission to ask some social questions. Maybe you wanna mention social questions may not be a a flag for me that this is this could be personal or uncomfortable. Maybe I'm gonna ask a little more some personal questions here. Is that alright with you? Just so I'm social question sounds fine to me until you start asking something that might sound personal. So you might use the word some more personal Okay. Perfect. Questions here. Nudge nonjudgmental. Didn't, you know, didn't bat an eye when when I said I smoke half a pack. You have nice vocal range, eye contact, comfortable demeanor, so that felt real good. And then you did a summary at the end and asked did you ask? Do anything else? Okay? Mhmm. So anything else before we do a physical exam? So it was very nice nice encounter. Well, thank you so much. Uh-huh. Nice meeting you. You too.`,
  
  patientSummary: `# Resumen de Consulta Médica

## Motivo de consulta
Acudiste a consulta por un fuerte dolor de cabeza que comenzó hace aproximadamente 3 días.

## Características del dolor
- Dolor intenso (calificado como 10/10 en la escala de dolor)
- Afecta toda la cabeza
- Es constante y no ha disminuido desde que comenzó
- Empeora con el movimiento y la exposición a la luz
- Se acompaña de rigidez en el cuello
- Has experimentado náuseas y vómitos

## Antecedentes relevantes
- Tienes antecedentes de presión arterial alta, controlada con dieta
- Tu madre tuvo migrañas cuando tenía entre 20 y 30 años
- Fumas aproximadamente medio paquete de cigarrillos al día
- Estuviste en una reunión familiar en Carolina del Norte hace una semana

## Medicamentos
Has intentado aliviar el dolor con Tylenol y Motrin, pero no has notado mejoría.

## Plan de acción
El médico realizará un examen físico y pruebas adicionales para determinar la causa de tu dolor de cabeza.

## Seguro médico
El personal de la clínica verificará la cobertura de tu nuevo seguro médico para esta consulta.`,
  
  medicalSummary: `# RESUMEN CLÍNICO

## S (Subjetivo)
Paciente femenina en menopausia presenta cefalea severa de 3 días de evolución. Refiere dolor de intensidad 10/10, constante, que involucra toda la cabeza con irradiación al cuello. El dolor es agravado por movimiento y fotosensibilidad. No hay alivio con analgésicos de venta libre (Tylenol, Motrin). Asocia náuseas y vómitos (dos episodios). 

La paciente expresa preocupación por posible tumor cerebral debido a caso de un conocido. El dolor ha impedido que asista al trabajo y afecta significativamente su calidad de vida. Refiere viaje reciente a Carolina del Norte hace una semana para reunión familiar donde hubo contacto con niño enfermo.

**Antecedentes personales:** Hipertensión diagnosticada hace 3 años, bien controlada con modificaciones dietéticas, sin medicación. Sin historial quirúrgico ni hospitalizaciones previas.

**Antecedentes familiares:** Madre con migrañas en la juventud. Padre con hipertensión.

**Hábitos:** Tabaquismo (medio paquete diario). No consume alcohol.

## O (Objetivo)
Examen físico pendiente de realizar.

## A (Análisis)
Pendiente tras examen físico y pruebas complementarias.

## P (Plan)
1. Realizar examen físico completo
2. Solicitar pruebas diagnósticas (pendientes de especificar)
3. Verificar cobertura del nuevo seguro médico de la paciente`,
  
  augmentedMedicalSummary: `# OPINIÓN CLÍNICA COMPLEMENTARIA

## Análisis Diferencial

Los síntomas presentados por la paciente (cefalea severa, rigidez de nuca, fotofobia, náuseas/vómitos) deben considerarse como signos de alarma que requieren evaluación urgente. El diagnóstico diferencial debe incluir:

1. **Meningitis** - La combinación de cefalea severa, rigidez de nuca y viaje reciente con exposición a enfermedad infecciosa es altamente sugestiva. La evolución subaguda (3 días) no descarta esta posibilidad.

2. **Hemorragia subaracnoidea** - Aunque típicamente de inicio súbito, la cefalea descrita como "la peor de mi vida" (10/10) con rigidez nucal merece consideración inmediata.

3. **Migraña con aura** - El antecedente familiar positivo y la fotofobia son sugestivos, pero la intensidad, constancia y falta de respuesta a analgésicos, junto con la rigidez nucal, hacen menos probable este diagnóstico como única explicación.

4. **Hipertensión intracraneal** - Considerando los vómitos y la cefalea holocraneana que empeora con el movimiento.

5. **Trombosis de senos venosos cerebrales** - Especialmente en mujer menopáusica fumadora (factores de riesgo).

## Pruebas Diagnósticas Recomendadas

1. **Neuroimagen urgente**:
   - TAC craneal sin contraste para descartar hemorragia/efecto de masa
   - Considerar angio-TAC o angio-RM si TAC normal y sospecha alta de patología vascular
   - RM cerebral con gadolinio si disponible

2. **Punción lumbar**:
   - Si neuroimagen no muestra contraindicaciones y persiste sospecha de meningitis
   - Evaluar presión de apertura, citoquímico, cultivos y PCR para patógenos neurotropos

3. **Análisis sanguíneos**:
   - Hemograma completo, VSG, PCR (marcadores inflamatorios)
   - Estudios de coagulación
   - Electrolitos y función renal (por posible deshidratación)

## Consideraciones Terapéuticas

1. **Manejo inmediato**:
   - Analgesia parenteral: considerar AINE parenterales o opioides si dolor severo
   - Antieméticos para controlar náuseas/vómitos
   - Control de constantes vitales, especialmente presión arterial (antecedente de HTA)

2. **Tratamiento específico**:
   - Antibioterapia empírica si sospecha de meningitis bacteriana (no demorar por resultados pendientes)
   - Medidas para reducir presión intracraneal si se confirma hipertensión intracraneal

## Referencias Clínicas Relevantes

- La Sociedad Española de Neurología (SEN) recomienda evaluación urgente en cefaleas con signos de alarma como inicio súbito, intensidad severa, síntomas neurológicos asociados o rigidez nucal.

- Según las guías IDSA 2016 para manejo de meningitis, la tríada clásica (fiebre, rigidez nucal, alteración del estado mental) está presente en menos del 50% de los casos, por lo que su ausencia no descarta el diagnóstico.

- El tabaquismo activo aumenta significativamente el riesgo de eventos cerebrovasculares, especialmente en mujeres postmenopáusicas (OR 1.7-2.5 según estudios recientes).

## Notas Adicionales

La paciente presenta múltiples signos de alarma que justifican evaluación neurológica inmediata y estudios complementarios urgentes. No se recomienda manejo ambulatorio hasta descartar patologías potencialmente graves.`
}; 