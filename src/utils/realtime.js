export const dispatchExamSubmitted = (examId, examTitle = "") => {
  window.dispatchEvent(
    new CustomEvent("examSubmitted", {
      detail: { examId, examTitle },
    })
  );

  console.log(`Dispatched examSubmitted event for exam: ${examId}`);
};
