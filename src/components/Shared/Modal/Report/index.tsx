import { gql, useMutation } from '@apollo/client';
import { Button } from '@components/UI/Button';
import { CardBody } from '@components/UI/Card';
import { EmptyState } from '@components/UI/EmptyState';
import { ErrorMessage } from '@components/UI/ErrorMessage';
import { Form, useZodForm } from '@components/UI/Form';
import { Spinner } from '@components/UI/Spinner';
import { TextArea } from '@components/UI/TextArea';
import { LensterPublication } from '@generated/lenstertypes';
import { PencilAltIcon } from '@heroicons/react/outline';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { Mixpanel } from '@lib/mixpanel';
import React, { FC, useState } from 'react';
import { useGlobalModalStateStore } from 'src/store/modals';
import { PUBLICATION } from 'src/tracking';
import { object, string } from 'zod';

import Reason from './Reason';

export const CREATE_REPORT_PUBLICATION_MUTATION = gql`
  mutation ReportPublication($request: ReportPublicationRequest!) {
    reportPublication(request: $request)
  }
`;

const newReportSchema = object({
  additionalComments: string().max(260, {
    message: 'Additional comments should not exceed 260 characters'
  })
});

interface Props {
  publication: LensterPublication;
}

const Report: FC<Props> = ({ publication }) => {
  const reportConfig = useGlobalModalStateStore((state) => state.reportConfig);
  const [type, setType] = useState(reportConfig?.type ?? '');
  const [subReason, setSubReason] = useState(reportConfig?.subReason ?? '');

  const [createReport, { data: submitData, loading: submitLoading, error: submitError }] = useMutation(
    CREATE_REPORT_PUBLICATION_MUTATION,
    {
      onCompleted: () => {
        Mixpanel.track(PUBLICATION.REPORT);
      }
    }
  );

  const form = useZodForm({
    schema: newReportSchema
  });

  const reportPublication = (additionalComments: string | null) => {
    createReport({
      variables: {
        request: {
          publicationId: publication?.id,
          reason: {
            [type]: {
              reason: type.replace('Reason', '').toUpperCase(),
              subreason: subReason
            }
          },
          additionalComments
        }
      }
    });
  };

  return (
    <div onClick={(event) => event.stopPropagation()}>
      {submitData?.reportPublication === null ? (
        <EmptyState
          message={<span>Publication reported successfully!</span>}
          icon={<CheckCircleIcon className="w-14 h-14 text-green-500" />}
          hideCard
        />
      ) : publication ? (
        <CardBody>
          <Form
            form={form}
            className="space-y-4"
            onSubmit={({ additionalComments }) => {
              reportPublication(additionalComments);
            }}
          >
            {submitError && <ErrorMessage title="Failed to report" error={submitError} />}
            <Reason setType={setType} setSubReason={setSubReason} type={type} subReason={subReason} />
            {subReason && (
              <>
                <TextArea
                  label="Description"
                  placeholder="Tell us something about the community!"
                  {...form.register('additionalComments')}
                />
                <div className="ml-auto">
                  <Button
                    type="submit"
                    disabled={submitLoading}
                    icon={submitLoading ? <Spinner size="xs" /> : <PencilAltIcon className="w-4 h-4" />}
                  >
                    Report
                  </Button>
                </div>
              </>
            )}
          </Form>
        </CardBody>
      ) : null}
    </div>
  );
};

export default Report;
