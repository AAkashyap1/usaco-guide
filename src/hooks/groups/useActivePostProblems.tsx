import * as React from 'react';
import { ReactElement, ReactNode } from 'react';
import { useNotificationSystem } from '../../context/NotificationSystemContext';
import UserDataContext from '../../context/UserDataContext/UserDataContext';
import {
  groupProblemConverter,
  GroupProblemData,
} from '../../models/groups/problem';
import useFirebase from '../useFirebase';
import { useActiveGroup } from './useActiveGroup';

const ActivePostProblemsContext = React.createContext<{
  activePostId: string;
  setActivePostId: React.Dispatch<React.SetStateAction<string>>;
  problems: GroupProblemData[];
  isLoading: boolean;
}>(null);

export function ActivePostProblemsProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const activeGroup = useActiveGroup();
  const { firebaseUser } = React.useContext(UserDataContext);
  const [activePostId, setActivePostId] = React.useState<string>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [problems, setProblems] = React.useState<GroupProblemData[]>();

  const notifications = useNotificationSystem();

  useFirebase(
    firebase => {
      setProblems(null);
      setIsLoading(true);
      if (activePostId === null || !firebaseUser?.uid) {
        return;
      }
      if (!activeGroup.activeGroupId) {
        throw new Error(
          'Cannot get post problems without being in an active group'
        );
      }

      return firebase
        .firestore()
        .collection('groups')
        .doc(activeGroup.activeGroupId)
        .collection('posts')
        .doc(activePostId)
        .collection('problems')
        .where('isDeleted', '==', false)
        .withConverter(groupProblemConverter)
        .onSnapshot(
          snap => {
            setProblems(
              snap.docs
                .map(doc => doc.data())
                .sort((a, b) => {
                  if (a.order === b.order) return a.name < b.name ? -1 : 1;
                  return a.order < b.order ? -1 : 1;
                })
            );
            setIsLoading(false);
          },
          error => {
            notifications.showErrorNotification(error);
          }
        );
    },
    [firebaseUser?.uid, activePostId, activeGroup.activeGroupId]
  );

  return (
    <ActivePostProblemsContext.Provider
      value={{
        activePostId,
        setActivePostId,
        problems,
        isLoading,
      }}
    >
      {children}
    </ActivePostProblemsContext.Provider>
  );
}

export function useActivePostProblems() {
  const context = React.useContext(ActivePostProblemsContext);
  if (context === null) {
    throw 'useActiveGroup must be used within a ActivePostProblemsProvider';
  }
  return context;
}
