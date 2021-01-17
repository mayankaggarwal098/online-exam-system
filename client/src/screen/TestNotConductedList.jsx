import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Button, Container } from 'react-bootstrap';
import { getNotConductedTestPaper } from '../actions/testAction';
import Loader from '../utils/Loader';
import TestTable from '../component/TestTable';

const TestNotConductedList = ({ history }) => {
  const { loading, error, notConductedTestPapers } = useSelector(state => state.getTestPaper);
  const { userInfo } = useSelector(state => state.userLogin);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }

    if (!notConductedTestPapers) {
      dispatch(getNotConductedTestPaper());
    }
  }, []);

  //PAGINATION
  const createHandler = () => {
    history.push('/tests/create');
  };

  return (
    <>
      {loading && <Loader />}
      <Container>
        <Row className="align-items-center">
          <Col>
            <h3 style={{ color: 'black' }}>All Tests</h3>
          </Col>
          <Col className="text-right py-2">
            <Button className="my-3" onClick={createHandler}>
              <i className="fas fa-plus"></i>&nbsp;&nbsp;Create New Test
            </Button>
          </Col>
        </Row>
        <TestTable testPapers={notConductedTestPapers} isShow={true} />
      </Container>
    </>
  );
};

export default TestNotConductedList;