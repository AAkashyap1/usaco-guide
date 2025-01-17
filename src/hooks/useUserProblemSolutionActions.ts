import { useContext } from 'react';
import UserDataContext from '../context/UserDataContext/UserDataContext';
import {
  UserSolutionForProblem,
  userSolutionForProblemConverter,
} from '../models/userSolutionForProblem';
import useFirebase from './useFirebase';

export default function useUserProblemSolutionActions() {
  const firebase = useFirebase();
  const { firebaseUser } = useContext(UserDataContext);

  return {
    submitSolution: async (
      solution: Omit<
        UserSolutionForProblem,
        'userID' | 'userName' | 'id' | 'upvotes' | 'timestamp'
      >
    ) => {
      await firebase
        .firestore()
        .collection('userProblemSolutions')
        .withConverter(userSolutionForProblemConverter)
        .add({
          id: undefined, // the ID is ignored by userSolutionForProblemConverter; we add it here to fix typescript issue
          ...solution,
          userID: firebaseUser.uid,
          userName: firebaseUser.displayName,
          upvotes: [],
          timestamp: firebase.firestore.Timestamp.now(),
        });
    },
    deleteSolution: async (solutionID: string) => {
      await firebase
        .firestore()
        .collection('userProblemSolutions')
        .doc(solutionID)
        .delete();
    },
    mutateSolution: async (
      solutionID: string,
      updates: Partial<UserSolutionForProblem>
    ) => {
      await firebase
        .firestore()
        .collection('userProblemSolutions')
        .doc(solutionID)
        .update(updates);
    },
    upvoteSolution: async (solutionID: string) => {
      await firebase
        .firestore()
        .collection('userProblemSolutions')
        .doc(solutionID)
        .update({
          upvotes: firebase.firestore.FieldValue.arrayUnion(firebaseUser.uid),
        });
    },
    undoUpvoteSolution: async (solutionID: string) => {
      await firebase
        .firestore()
        .collection('userProblemSolutions')
        .doc(solutionID)
        .update({
          upvotes: firebase.firestore.FieldValue.arrayRemove(firebaseUser.uid),
        });
    },
  };
}
