import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Table, Modal, Form } from "react-bootstrap";
import Loader from "../utils/Loader";
import { getAllRegisteredStudent } from "../actions/studentRegistrationAction";
import {
  getSinglePaper,
  getTestCategory,
  testEnd,
} from "../actions/testAction";
import download from "downloadjs";
import {
  getResponsePdf,
  responseSheetOfStudent,
} from "./../actions/responseSheetAction";
import { editResultScore, getScore } from "./../actions/generateResultAction";
const Trainees = ({ id }) => {
  const [show, setShow] = useState(false);
  const [pos, setIndex] = useState(0);
  const [marks, setMarks] = useState(0);
  const dispatch = useDispatch();
  const { loading, registeredStudent: students } = useSelector(
    (state) => state.registeredStudentList
  );
  let { paper } = useSelector((state) => state.singleTestPaper);
  const scores = useRef([]);
  useEffect(() => {
    dispatch(getAllRegisteredStudent(id));
    dispatch(getSinglePaper(id));
    const getAllScore = async () => {
      scores.current = await getScore(id);
    };
    getAllScore();
  }, []);
  // console.log(scores.current.length);
  const resultWindowHandler = (studentId) => {
    window.open(`/student/test/result?testId=${id}&studentId=${studentId}`);
  };
  const snapshotHandler = (studentId) => {
    window.open(`/student/test/snapshots?testId=${id}&studentId=${studentId}`);
  };
  const audioHandler = (studentId) => {
    window.open(`/student/test/audio?testId=${id}&studentId=${studentId}`);
  };
  const downloadPdf = async (studentId, studentName) => {
    const pdf = await getResponsePdf(studentId, id);
    //console.log(paper.pdf);
    download(pdf, `${studentName}_responsesheet.pdf`, "application/pdf");
  };
  const editScore = async (studentId) => {
    console.log(studentId);
    //await editResultScore(id, studentId, marks);
  };
  const set = (index) => {
    setShow(true);
    setIndex(index);
  };

  return (
    <>
      {loading && <Loader />}
      <Button
        className="my-3"
        onClick={() => dispatch(getAllRegisteredStudent(id))}
      >
        <i className="fas fa-sync"></i>&nbsp;&nbsp;Reload
      </Button>
      <Table
        hover
        bordered
        striped
        responsive
        style={{ textAlign: "center", marginTop: "10px" }}
      >
        <thead>
          <tr>
            <th>SNo.</th>
            <th>STUDENT NAME</th>
            <th>EMAIL ID</th>
            <th>MOBILE NO.</th>
            {paper && paper.category === "PDF" && (
              <>
                <th>Obtained Marks</th>
                <th>Edit/Give Marks</th>
                <th>Response Sheet</th>
              </>
            )}
            <th>PERFORMANCE</th>
            <th>SNAPSHOT</th>
            <th>Audio Recording</th>
          </tr>
        </thead>
        <tbody>
          {students &&
            students.map((stud, index) => (
              <tr key={index + 1}>
                <td>{index + 1}</td>
                <td>{stud.name}</td>
                <td>{stud.email}</td>
                <td>{stud.phoneNum}</td>
                {paper && paper.category === "PDF" && (
                  <>
                    <td>
                      {scores.current.length === 0 && `Not Checked`}
                      {scores.current.map((result) => {
                        if (toString(result.studenId) === toString(stud._id)) {
                          if (result.score === -1) {
                            return `Not Checked`;
                          } else {
                            return `${result.score}`;
                          }
                        }
                      })}
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        onClick={() => set(index)}
                      >
                        Edit
                      </Button>
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        onClick={() => downloadPdf(stud._id, stud.name)}
                      >
                        Download
                      </Button>
                    </td>
                  </>
                )}
                <td>
                  <Button
                    variant="outline-danger"
                    onClick={() => resultWindowHandler(stud._id)}
                  >
                    Result
                  </Button>
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    onClick={() => snapshotHandler(stud._id)}
                  >
                    SnapShot
                  </Button>
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    onClick={() => audioHandler(stud._id)}
                  >
                    Audio
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
      {students && students[pos] && (
        <Modal
          show={show}
          onHide={() => setShow(false)}
          dialogClassName="my-modal"
          aria-labelledby="example-custom-modal-styling-title"
        >
          <Modal.Body>
            <Form>
              <Form.Group controlId="question">
                <Form.Label>Marks</Form.Label>
                <Form.Control
                  required
                  placeholder="Enter Marks"
                  type="text"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="outline-primary"
                onClick={() => editScore(students[pos]._id)}
              >
                Submit
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};

export default Trainees;
